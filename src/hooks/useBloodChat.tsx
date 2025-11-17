import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BloodChatMessage {
  id: string;
  request_id?: string;
  hospital_request_id?: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export const useBloodChat = (
  requestId: string | null,
  type: 'blood' | 'hospital' = 'blood'
) => {
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
    const channelName = type === 'hospital' 
      ? `hospital_chat_${requestId}_${Date.now()}`
      : `blood_chat_${requestId}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blood_chat',
          filter: type === 'hospital' 
            ? `hospital_request_id=eq.${requestId}`
            : `request_id=eq.${requestId}`
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          fetchMessages();
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, user, type]);

  const fetchMessages = async () => {
    if (!requestId || !user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('blood_chat')
        .select(`
          *,
          sender:profiles!blood_chat_sender_id_fkey(first_name, last_name),
          receiver:profiles!blood_chat_receiver_id_fkey(first_name, last_name)
        `);

      if (type === 'hospital') {
        query = query.eq('hospital_request_id', requestId);
      } else {
        query = query.eq('request_id', requestId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      // Format messages with sender/receiver names
      const formatted = await Promise.all((data || []).map(async (msg: any) => {
        let senderName = 'Unknown';
        let receiverName = 'Unknown';

        // Try to get sender name from profiles
        if (msg.sender) {
          senderName = `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim() || 'Unknown';
        } else {
          // Try hospital_profiles for sender
          const { data: hospitalData } = await supabase
            .from('hospital_profiles')
            .select('hospital_name')
            .eq('id', msg.sender_id)
            .single();
          if (hospitalData) {
            senderName = hospitalData.hospital_name;
          }
        }

        // Try to get receiver name from profiles
        if (msg.receiver) {
          receiverName = `${msg.receiver.first_name || ''} ${msg.receiver.last_name || ''}`.trim() || 'Unknown';
        } else {
          // Try hospital_profiles for receiver
          const { data: hospitalData } = await supabase
            .from('hospital_profiles')
            .select('hospital_name')
            .eq('id', msg.receiver_id)
            .single();
          if (hospitalData) {
            receiverName = hospitalData.hospital_name;
          }
        }

        return {
          ...msg,
          sender_name: senderName,
          receiver_name: receiverName,
        };
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

  const sendMessage = async (
    receiverId: string, 
    message: string,
    hospitalRequestId?: string
  ) => {
    if (!user || !requestId) {
      toast({
        title: 'Error',
        description: 'Unable to send message',
        variant: 'destructive',
      });
      return { error: 'Invalid state' };
    }

    try {
      const messageData: any = {
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim(),
      };

      if (type === 'hospital' && hospitalRequestId) {
        messageData.hospital_request_id = hospitalRequestId;
      } else {
        messageData.request_id = requestId;
      }

      const { data, error } = await supabase
        .from('blood_chat')
        .insert([messageData])
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
