import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBloodChat } from '@/hooks/useBloodChat';
import { useBloodRequests } from '@/hooks/useBloodRequests';
import { useAuth } from '@/hooks/useAuth';
import { Send, X, MessageCircle } from 'lucide-react';

interface BloodRequestChatProps {
  requestId: string;
  onClose: () => void;
}

const BloodRequestChat = ({ requestId, onClose }: BloodRequestChatProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markAsRead, unreadCount } = useBloodChat(requestId);
  const { requests } = useBloodRequests();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRequest = requests.find(r => r.id === requestId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark messages as read
    const unreadIds = messages
      .filter(m => !m.is_read && m.receiver_id === user?.id)
      .map(m => m.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [messages, user, markAsRead]);

  const handleSend = async () => {
    if (!messageText.trim() || !user || !currentRequest) return;

    // Determine receiver (opposite of requester)
    const receiverId = currentRequest.requester_id === user.id 
      ? currentRequest.requester_id // This should be the donor's ID in real scenario
      : currentRequest.requester_id;

    setSending(true);
    await sendMessage(receiverId, messageText);
    setMessageText('');
    setSending(false);
  };

  const getReceiverId = () => {
    if (!currentRequest || !user) return null;
    // In a real scenario, you'd get the other participant's ID
    // For now, we'll use the requester_id as the other party
    return currentRequest.requester_id !== user.id 
      ? currentRequest.requester_id 
      : null; // Need to get donor ID from request
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat - Blood Request
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[300px] max-h-[400px] border rounded-lg p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {isOwn ? 'You' : message.sender_name}
                    </p>
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={sending || !getReceiverId()}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !messageText.trim() || !getReceiverId()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BloodRequestChat;

