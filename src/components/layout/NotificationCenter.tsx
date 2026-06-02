import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Trash2, Clock, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export const NotificationCenter = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Get all notifications for user or global
            const { data: notifs, error } = await supabase
                .from("notifications")
                .select("*")
                .or(`user_id.eq.${user.id},user_id.is.null`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Get read statuses
            const { data: reads, error: readsError } = await supabase
                .from("notification_reads")
                .select("notification_id")
                .eq("user_id", user.id);

            if (readsError) throw readsError;

            const readIds = new Set(reads.map(r => r.notification_id));
            
            const processedNotifs = (notifs || []).map(n => ({
                ...n,
                is_read: readIds.has(n.id)
            }));

            setNotifications(processedNotifs);
            setUnreadCount(processedNotifs.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        // Subscription for real-time notifications
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications' 
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from("notification_reads")
                .upsert({ user_id: user.id, notification_id: id });

            if (error) throw error;
            
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user || notifications.length === 0) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        try {
            const inserts = unreadIds.map(id => ({ user_id: user.id, notification_id: id }));
            const { error } = await supabase
                .from("notification_reads")
                .upsert(inserts);

            if (error) throw error;
            
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast({ title: "All cleared", description: "All notifications marked as read." });
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-cyan-500" />;
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-slate-950 border-l border-white/10 p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-6 md:p-8 border-b border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                <Inbox className="h-5 w-5 text-primary" /> Intelligence Center
                            </SheetTitle>
                            <SheetDescription className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                System alerts and operational updates.
                            </SheetDescription>
                        </div>
                        {unreadCount > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={markAllAsRead}
                                className="text-[8px] font-black uppercase tracking-widest text-primary hover:text-primary/80 hover:bg-primary/5 transition-all"
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 opacity-20">
                            <Bell className="h-12 w-12" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No transmissions found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={cn(
                                        "p-6 transition-all group relative",
                                        !n.is_read ? "bg-primary/5" : "hover:bg-white/[0.01]"
                                    )}
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                >
                                    {!n.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                                            !n.is_read ? "bg-primary/10 border-primary/20" : "bg-white/5 border-white/5"
                                        )}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={cn(
                                                    "text-[11px] font-black uppercase italic tracking-tight leading-none",
                                                    !n.is_read ? "text-white" : "text-white/60"
                                                )}>
                                                    {n.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 opacity-40 shrink-0">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    <span className="text-[8px] font-bold uppercase">{new Date(n.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className={cn(
                                                "text-[10px] font-medium leading-relaxed",
                                                !n.is_read ? "text-white/80" : "text-white/40"
                                            )}>
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
