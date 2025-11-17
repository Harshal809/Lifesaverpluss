import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBloodChat } from '@/hooks/useBloodChat';
import { useBloodRequests } from '@/hooks/useBloodRequests';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, ArrowLeft, Droplet, User, Clock, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatConversation {
  request_id?: string;
  hospital_request_id?: string;
  request?: any;
  hospital_request?: any;
  last_message: any;
  unread_count: number;
  other_user: {
    id: string;
    name: string;
  };
  type: 'blood_request' | 'hospital_request';
}

const BloodChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const hospitalRequestId = searchParams.get('hospitalRequestId');
  const donorId = searchParams.get('donorId');
  const donorName = searchParams.get('donorName');
  const hospitalId = searchParams.get('hospitalId');
  const hospitalName = searchParams.get('hospitalName');
  const userId = searchParams.get('userId');
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(requestId);
  const [selectedHospitalRequestId, setSelectedHospitalRequestId] = useState<string | null>(hospitalRequestId);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [findingRequest, setFindingRequest] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{ name: string; id: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatRequestId = selectedHospitalRequestId || selectedRequestId;
  const chatType = selectedHospitalRequestId ? 'hospital' : 'blood';
  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useBloodChat(
    chatRequestId,
    chatType
  );
  const { requests, loading: requestsLoading } = useBloodRequests({ status: ['active', 'partially_fulfilled', 'fulfilled', 'cancelled'] });

  // Fetch other user profile (donor, hospital, or user)
  useEffect(() => {
    const fetchOtherUserProfile = async () => {
      const targetId = donorId || hospitalId || userId;
      if (targetId) {
        try {
          // Try profiles first
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', targetId)
            .single();

          if (!profileError && profileData) {
            const name = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'User';
            setOtherUserProfile({ name, id: targetId });
            return;
          }

          // If not in profiles, try hospital_profiles
          const { data: hospitalData, error: hospitalError } = await supabase
            .from('hospital_profiles')
            .select('id, hospital_name')
            .eq('id', targetId)
            .single();

          if (!hospitalError && hospitalData) {
            setOtherUserProfile({ name: hospitalData.hospital_name, id: targetId });
          }
        } catch (error) {
          console.error('Error fetching other user profile:', error);
        }
      }
    };

    fetchOtherUserProfile();
  }, [donorId, hospitalId, userId]);

  // Handle hospital chat initiation
  useEffect(() => {
    if (hospitalId && !selectedHospitalRequestId && !loading && user) {
      findOrCreateHospitalRequest();
    }
  }, [hospitalId, user, loading]);

  // Handle donor chat initiation
  useEffect(() => {
    if (donorId && !selectedRequestId && !requestsLoading && user) {
      findOrCreateRequestForDonor();
    }
  }, [donorId, user, requestsLoading, requests.length]);

  useEffect(() => {
    if (selectedRequestId || selectedHospitalRequestId) {
      fetchConversations();
    }
  }, [selectedRequestId, selectedHospitalRequestId, user]);

  const findOrCreateHospitalRequest = async () => {
    if (!user || !hospitalId) return;

    setFindingRequest(true);
    try {
      // Check if there's an existing hospital request
      const { data: existingRequests, error: reqError } = await supabase
        .from('user_hospital_blood_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('hospital_id', hospitalId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!reqError && existingRequests && existingRequests.length > 0) {
        setSelectedHospitalRequestId(existingRequests[0].id);
        const path = window.location.pathname;
        const basePath = path.includes('/hospital/') 
          ? '/dashboard/hospital/bloodconnect/chat'
          : '/dashboard/user/bloodconnect/chat';
        const params = new URLSearchParams();
        params.set('hospitalRequestId', existingRequests[0].id);
        if (hospitalId) params.set('hospitalId', hospitalId);
        if (hospitalName) params.set('hospitalName', hospitalName);
        navigate(`${basePath}?${params.toString()}`, { replace: true });
        setFindingRequest(false);
        return;
      }

      // Check for existing chats with this hospital
      const { data: existingChats } = await supabase
        .from('blood_chat')
        .select(`
          hospital_request_id,
          hospital_request:user_hospital_blood_requests!blood_chat_hospital_request_id_fkey(*),
          sender_id,
          receiver_id
        `)
        .or(`sender_id.eq.${hospitalId},receiver_id.eq.${hospitalId}`)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      // Find a chat where the other participant is the hospital
      if (existingChats && existingChats.length > 0) {
        const hospitalChat = existingChats.find((chat: any) => {
          const otherUserId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
          return otherUserId === hospitalId && chat.hospital_request;
        });

        if (hospitalChat && hospitalChat.hospital_request) {
          const req = hospitalChat.hospital_request as any;
          setSelectedHospitalRequestId(req.id);
          const path = window.location.pathname;
          const basePath = path.includes('/hospital/') 
            ? '/dashboard/hospital/bloodconnect/chat'
            : '/dashboard/user/bloodconnect/chat';
          const params = new URLSearchParams();
          params.set('hospitalRequestId', req.id);
          if (hospitalId) params.set('hospitalId', hospitalId);
          if (hospitalName) params.set('hospitalName', hospitalName);
          navigate(`${basePath}?${params.toString()}`, { replace: true });
          setFindingRequest(false);
          return;
        }
      }

      // No existing request - show message
      toast({
        title: 'No Active Request',
        description: 'Please create a blood request from this hospital first.',
        variant: 'default',
      });
      
      const path = window.location.pathname;
      if (path.includes('/hospital/')) {
        navigate('/dashboard/hospital/bloodconnect');
      } else {
        navigate(`/dashboard/user/bloodconnect/hospitals/${hospitalId}`);
      }
    } catch (error) {
      console.error('Error finding hospital request:', error);
      toast({
        title: 'Error',
        description: 'Failed to find request for chat',
        variant: 'destructive',
      });
    } finally {
      setFindingRequest(false);
    }
  };

  const findOrCreateRequestForDonor = async () => {
    if (!user || !donorId) return;

    setFindingRequest(true);
    try {
      const myRequests = requests.filter(r => 
        r.requester_id === user.id && 
        (r.status === 'active' || r.status === 'partially_fulfilled' || r.status === 'fulfilled')
      );
      
      if (myRequests.length > 0) {
        const activeRequest = myRequests.find(r => r.status === 'active' || r.status === 'partially_fulfilled') || myRequests[0];
        setSelectedRequestId(activeRequest.id);
        const path = window.location.pathname;
        const basePath = path.includes('/hospital/') 
          ? '/dashboard/hospital/bloodconnect/chat'
          : '/dashboard/user/bloodconnect/chat';
        const params = new URLSearchParams();
        params.set('requestId', activeRequest.id);
        if (donorId) params.set('donorId', donorId);
        if (donorName) params.set('donorName', donorName);
        navigate(`${basePath}?${params.toString()}`, { replace: true });
        setFindingRequest(false);
        return;
      }

      const { data: dbRequests, error: dbError } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('requester_id', user.id)
        .in('status', ['active', 'partially_fulfilled', 'fulfilled'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!dbError && dbRequests && dbRequests.length > 0) {
        const activeRequest = dbRequests.find(r => r.status === 'active' || r.status === 'partially_fulfilled') || dbRequests[0];
        setSelectedRequestId(activeRequest.id);
        const path = window.location.pathname;
        const basePath = path.includes('/hospital/') 
          ? '/dashboard/hospital/bloodconnect/chat'
          : '/dashboard/user/bloodconnect/chat';
        const params = new URLSearchParams();
        params.set('requestId', activeRequest.id);
        if (donorId) params.set('donorId', donorId);
        if (donorName) params.set('donorName', donorName);
        navigate(`${basePath}?${params.toString()}`, { replace: true });
        setFindingRequest(false);
        return;
      }

      const { data: existingChats } = await supabase
        .from('blood_chat')
        .select(`
          request_id, 
          request:blood_requests!blood_chat_request_id_fkey(*),
          sender_id,
          receiver_id
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (existingChats && existingChats.length > 0) {
        const donorChat = existingChats.find((chat: any) => {
          const otherUserId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
          return otherUserId === donorId && chat.request;
        });

        if (donorChat && donorChat.request) {
          const req = donorChat.request as any;
          setSelectedRequestId(req.id);
          const path = window.location.pathname;
          const basePath = path.includes('/hospital/') 
            ? '/dashboard/hospital/bloodconnect/chat'
            : '/dashboard/user/bloodconnect/chat';
          const params = new URLSearchParams();
          params.set('requestId', req.id);
          if (donorId) params.set('donorId', donorId);
          if (donorName) params.set('donorName', donorName);
          navigate(`${basePath}?${params.toString()}`, { replace: true });
          setFindingRequest(false);
          return;
        }
      }

      toast({
        title: 'No Active Request',
        description: 'Please create a blood request first to chat with this donor.',
        variant: 'default',
      });
      
      const path = window.location.pathname;
      if (path.includes('/hospital/')) {
        navigate('/dashboard/hospital/bloodconnect?tab=requests');
      } else {
        navigate('/dashboard/user/bloodconnect?tab=requests');
      }
    } catch (error) {
      console.error('Error finding request:', error);
      toast({
        title: 'Error',
        description: 'Failed to find request for chat',
        variant: 'destructive',
      });
    } finally {
      setFindingRequest(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`blood_chat_conversations_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blood_chat',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch blood request conversations
      const { data: chatData, error } = await supabase
        .from('blood_chat')
        .select(`
          *,
          request:blood_requests!blood_chat_request_id_fkey(*),
          hospital_request:user_hospital_blood_requests!blood_chat_hospital_request_id_fkey(*),
          sender:profiles!blood_chat_sender_id_fkey(id, first_name, last_name),
          receiver:profiles!blood_chat_receiver_id_fkey(id, first_name, last_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by request_id or hospital_request_id
      const conversationMap = new Map<string, ChatConversation>();

      // Process messages sequentially to handle async hospital name fetching
      for (const msg of (chatData || [])) {
        // Handle blood request conversations
        if (msg.request_id && msg.request) {
          const requestId = msg.request_id;
          const isRequester = msg.request.requester_id === user.id;
          const otherUserId = isRequester ? msg.sender_id : msg.receiver_id;
          const otherUser = isRequester ? msg.sender : msg.receiver;
          const otherUserName = otherUser
            ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim()
            : 'Unknown';

          if (!conversationMap.has(`blood_${requestId}`)) {
            conversationMap.set(`blood_${requestId}`, {
              request_id: requestId,
              request: msg.request,
              last_message: msg,
              unread_count: 0,
              other_user: {
                id: otherUserId,
                name: otherUserName,
              },
              type: 'blood_request',
            });
          } else {
            const conv = conversationMap.get(`blood_${requestId}`)!;
            if (new Date(msg.created_at) > new Date(conv.last_message.created_at)) {
              conv.last_message = msg;
            }
            if (!msg.is_read && msg.receiver_id === user.id) {
              conv.unread_count++;
            }
          }
        }

        // Handle hospital request conversations
        if (msg.hospital_request_id && msg.hospital_request) {
          const hospitalRequestId = msg.hospital_request_id;
          const isUserRequester = msg.hospital_request.user_id === user.id;
          const otherUserId = isUserRequester ? msg.hospital_request.hospital_id : msg.hospital_request.user_id;
          
          // Get other user name
          let otherUserName = 'Unknown';
          if (isUserRequester) {
            // Other user is hospital - fetch hospital name
            const { data: hospitalData } = await supabase
              .from('hospital_profiles')
              .select('hospital_name')
              .eq('id', otherUserId)
              .single();
            otherUserName = hospitalData?.hospital_name || 'Hospital';
          } else {
            // Other user is regular user - use sender/receiver profile
            const otherUser = isUserRequester ? msg.sender : msg.receiver;
            otherUserName = otherUser
              ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim()
              : 'User';
          }

          if (!conversationMap.has(`hospital_${hospitalRequestId}`)) {
            conversationMap.set(`hospital_${hospitalRequestId}`, {
              hospital_request_id: hospitalRequestId,
              hospital_request: msg.hospital_request,
              last_message: msg,
              unread_count: 0,
              other_user: {
                id: otherUserId,
                name: otherUserName,
              },
              type: 'hospital_request',
            });
          } else {
            const conv = conversationMap.get(`hospital_${hospitalRequestId}`)!;
            if (new Date(msg.created_at) > new Date(conv.last_message.created_at)) {
              conv.last_message = msg;
            }
            if (!msg.is_read && msg.receiver_id === user.id) {
              conv.unread_count++;
            }
          }
        }
      }

      // Also include user's own requests that might not have messages yet
      const myRequests = requests.filter(r => r.requester_id === user.id);
      myRequests.forEach(request => {
        if (!conversationMap.has(`blood_${request.id}`)) {
          conversationMap.set(`blood_${request.id}`, {
            request_id: request.id,
            request: request,
            last_message: null,
            unread_count: 0,
            other_user: {
              id: '',
              name: 'No messages yet',
            },
            type: 'blood_request',
          });
        }
      });

      // Also include user's hospital requests
      const { data: hospitalRequests } = await supabase
        .from('user_hospital_blood_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved']);

      // Fetch hospital names for hospital requests
      const hospitalIds = [...new Set(hospitalRequests?.map(r => r.hospital_id) || [])];
      const { data: hospitalsData } = await supabase
        .from('hospital_profiles')
        .select('id, hospital_name')
        .in('id', hospitalIds);

      const hospitalMap = new Map(hospitalsData?.map(h => [h.id, h.hospital_name]) || []);

      hospitalRequests?.forEach(request => {
        if (!conversationMap.has(`hospital_${request.id}`)) {
          conversationMap.set(`hospital_${request.id}`, {
            hospital_request_id: request.id,
            hospital_request: request,
            last_message: null,
            unread_count: 0,
            other_user: {
              id: request.hospital_id,
              name: hospitalMap.get(request.hospital_id) || 'Hospital',
            },
            type: 'hospital_request',
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((selectedRequestId || selectedHospitalRequestId) && messages.length > 0) {
      const unreadIds = messages
        .filter(m => !m.is_read && m.receiver_id === user?.id)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
        fetchConversations();
      }
    }
  }, [selectedRequestId, selectedHospitalRequestId, messages, user, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !user) return;

    let receiverId: string | null = null;

    // Handle hospital request chat
    if (selectedHospitalRequestId) {
      const { data: hospitalRequest } = await supabase
        .from('user_hospital_blood_requests')
        .select('*')
        .eq('id', selectedHospitalRequestId)
        .single();

      if (hospitalRequest) {
        if (hospitalRequest.user_id === user.id) {
          // User is requesting, send to hospital
          receiverId = hospitalRequest.hospital_id;
        } else {
          // Hospital is responding, send to user
          receiverId = hospitalRequest.user_id;
        }
      }
    } 
    // Handle blood request chat
    else if (selectedRequestId) {
      const currentRequest = requests.find(r => r.id === selectedRequestId);
      if (!currentRequest) return;

      if (currentRequest.requester_id === user.id) {
        if (donorId) {
          receiverId = donorId;
        } else {
          const otherMessage = messages.find(m => m.sender_id !== user.id);
          if (otherMessage) {
            receiverId = otherMessage.sender_id;
          }
        }
      } else {
        receiverId = currentRequest.requester_id;
      }
    }

    if (!receiverId) {
      toast({
        title: 'Error',
        description: 'Unable to determine recipient. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    const result = await sendMessage(
      receiverId, 
      messageText,
      selectedHospitalRequestId
    );
    if (!result.error) {
      setMessageText('');
      fetchConversations();
    }
    setSending(false);
  };

  const selectedConversation = conversations.find(c => 
    (c.request_id === selectedRequestId) || 
    (c.hospital_request_id === selectedHospitalRequestId)
  );
  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const selectedHospitalRequest = selectedConversation?.hospital_request;

  const displayName = otherUserProfile?.name || 
    (hospitalName ? decodeURIComponent(hospitalName) : null) ||
    (donorName ? decodeURIComponent(donorName) : null) ||
    selectedConversation?.other_user.name ||
    'Unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              const path = window.location.pathname;
              if (path.includes('/hospital/')) {
                navigate('/dashboard/hospital/bloodconnect');
              } else {
                navigate('/dashboard/user/bloodconnect');
              }
            }}
            className="mb-4 hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blood Connect
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            Blood Connect Chat
          </h1>
          <p className="text-muted-foreground mt-2">
            Chat with donors, hospitals, and requesters about blood requests
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations Sidebar */}
          <Card className="lg:col-span-1 border-2 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">Start a chat from a request or hospital</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {conversations.map((conv) => {
                    const isSelected = (conv.request_id === selectedRequestId) || 
                                     (conv.hospital_request_id === selectedHospitalRequestId);
                    const isHospitalRequest = conv.type === 'hospital_request';
                    
                    return (
                      <button
                        key={isHospitalRequest ? `hospital_${conv.hospital_request_id}` : `blood_${conv.request_id}`}
                        onClick={() => {
                          if (isHospitalRequest) {
                            setSelectedHospitalRequestId(conv.hospital_request_id || null);
                            setSelectedRequestId(null);
                          } else {
                            setSelectedRequestId(conv.request_id || null);
                            setSelectedHospitalRequestId(null);
                          }
                          const path = window.location.pathname;
                          const basePath = path.includes('/hospital/') 
                            ? '/dashboard/hospital/bloodconnect/chat'
                            : '/dashboard/user/bloodconnect/chat';
                          const params = new URLSearchParams();
                          if (conv.request_id) params.set('requestId', conv.request_id);
                          if (conv.hospital_request_id) params.set('hospitalRequestId', conv.hospital_request_id);
                          if (hospitalId) params.set('hospitalId', hospitalId);
                          if (hospitalName) params.set('hospitalName', hospitalName);
                          if (donorId) params.set('donorId', donorId);
                          if (donorName) params.set('donorName', donorName);
                          navigate(`${basePath}?${params.toString()}`);
                        }}
                        className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isHospitalRequest ? (
                                <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              ) : (
                                <Droplet className="h-4 w-4 text-red-600 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-sm truncate">
                                {isHospitalRequest 
                                  ? `${conv.hospital_request?.blood_group || 'N/A'} - ${conv.hospital_request?.units_required || 0} unit(s)`
                                  : `${conv.request?.blood_group || 'N/A'} - ${conv.request?.units_required || 0} unit(s)`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">{conv.other_user.name}</span>
                            </div>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-red-600 text-white">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        {conv.last_message && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(conv.last_message.created_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col border-2 shadow-lg bg-white">
            {findingRequest ? (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Finding conversation...</p>
                </div>
              </CardContent>
            ) : (selectedRequestId || selectedHospitalRequestId) ? (
              <>
                <CardHeader className="border-b-2 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedHospitalRequestId ? (
                          <Building2 className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Droplet className="h-5 w-5 text-red-600" />
                        )}
                        {selectedHospitalRequestId 
                          ? `${selectedHospitalRequest?.blood_group || 'N/A'} - ${selectedHospitalRequest?.units_required || 0} unit(s)`
                          : `${selectedRequest?.blood_group || 'N/A'} - ${selectedRequest?.units_required || 0} unit(s)`
                        }
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Chatting with {displayName}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[500px] bg-gray-50/50">
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        const senderName = isOwn ? 'You' : displayName;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl p-4 shadow-md ${
                                isOwn
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                  : 'bg-white border-2 border-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-xs font-semibold mb-1 opacity-80">
                                {senderName}
                              </p>
                              <p className="text-sm leading-relaxed">{message.message}</p>
                              <p className={`text-xs mt-2 ${
                                isOwn ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t-2 p-4 bg-white">
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
                        placeholder={`Type your message to ${displayName}...`}
                        disabled={sending}
                        className="h-12 text-base"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={sending || !messageText.trim() || (!selectedRequestId && !selectedHospitalRequestId)}
                        className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                      >
                        {sending ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Select a conversation to start chatting</p>
                  <p className="text-sm mt-1">Or start a new chat from a request or hospital</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BloodChatPage;
