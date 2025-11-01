import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BloodChatMessage {
  id: string;
  request_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export const useBloodChat = (requestId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<BloodChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!requestId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    // Real-time subscription for messages
    const channel = supabase
      .channel(`blood_chat_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blood_chat',
          filter: `request_id=eq.${requestId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, user]);

  const fetchMessages = async () => {
    if (!requestId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blood_chat')
        .select(`
          *,
          sender:profiles!blood_chat_sender_id_fkey(first_name, last_name),
          receiver:profiles!blood_chat_receiver_id_fkey(first_name, last_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: msg.sender
          ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim()
          : 'Unknown',
        receiver_name: msg.receiver
          ? `${msg.receiver.first_name || ''} ${msg.receiver.last_name || ''}`.trim()
          : 'Unknown',
      }));

      setMessages(formatted);

      // Count unread messages
      const unread = formatted.filter(
        (m: BloodChatMessage) => !m.is_read && m.receiver_id === user.id
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (receiverId: string, message: string) => {
    if (!user || !requestId) {
      toast({
        title: 'Error',
        description: 'Unable to send message',
        variant: 'destructive',
      });
      return { error: 'Invalid state' };
    }

    try {
      const { data, error } = await supabase
        .from('blood_chat')
        .insert([
          {
            request_id: requestId,
            sender_id: user.id,
            receiver_id: receiverId,
            message: message.trim(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      fetchMessages();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      await supabase
        .from('blood_chat')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('receiver_id', user.id);

      fetchMessages();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
};

