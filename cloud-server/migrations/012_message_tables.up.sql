-- Cloud Server Message Module Database Migration
-- Implements FR44-FR48, FR92-FR98, FR611-FR618

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    msg_type TEXT NOT NULL CHECK(msg_type IN ('system', 'approval', 'task', 'mention', 'chat')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    recipient_id TEXT NOT NULL,
    recipient_type TEXT NOT NULL CHECK(recipient_type IN ('user', 'department', 'all')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'archived')),
    action_url TEXT,
    metadata TEXT,
    created_at BIGINT NOT NULL,
    read_at BIGINT,
    pinned BOOLEAN DEFAULT FALSE,
    pinned_at BIGINT,
    edited BOOLEAN DEFAULT FALSE,
    edited_at BIGINT,
    edit_history TEXT,
    recalled BOOLEAN DEFAULT FALSE,
    recalled_at BIGINT,
    original_content TEXT,
    deleted_at BIGINT,
    version INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced' CHECK(sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    synced_at BIGINT
);

CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_recipient ON messages(tenant_id, recipient_id);
CREATE INDEX idx_messages_type ON messages(tenant_id, msg_type);
CREATE INDEX idx_messages_status ON messages(tenant_id, status);
CREATE INDEX idx_messages_created ON messages(tenant_id, created_at DESC);
CREATE INDEX idx_messages_pinned ON messages(tenant_id, pinned) WHERE pinned = TRUE;

-- Message status tracking (FR622-FR626)
CREATE TABLE IF NOT EXISTS message_status (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'delivered', 'read')),
    sent_at BIGINT,
    delivered_at BIGINT,
    read_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_msg_status_message ON message_status(message_id);
CREATE INDEX idx_msg_status_recipient ON message_status(tenant_id, recipient_id);

-- Notification preferences (FR1113)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    do_not_disturb_enabled BOOLEAN DEFAULT FALSE,
    dnd_start_time TEXT,
    dnd_end_time TEXT,
    dnd_days TEXT,
    channel_in_app BOOLEAN DEFAULT TRUE,
    channel_email BOOLEAN DEFAULT FALSE,
    channel_push BOOLEAN DEFAULT FALSE,
    type_system BOOLEAN DEFAULT TRUE,
    type_approval BOOLEAN DEFAULT TRUE,
    type_task BOOLEAN DEFAULT TRUE,
    type_mention BOOLEAN DEFAULT TRUE,
    type_chat BOOLEAN DEFAULT TRUE,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX idx_notif_pref_user ON notification_preferences(tenant_id, user_id);

-- Announcements (FR44-FR45)
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    target_type TEXT NOT NULL CHECK(target_type IN ('all', 'department', 'role', 'user')),
    target_value TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    published_at BIGINT,
    expires_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    deleted_at BIGINT
);

CREATE INDEX idx_announcements_tenant ON announcements(tenant_id);
CREATE INDEX idx_announcements_published ON announcements(tenant_id, published_at DESC);

-- Announcement read records
CREATE TABLE IF NOT EXISTS announcement_reads (
    id TEXT PRIMARY KEY,
    announcement_id TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    read_at BIGINT NOT NULL,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_ann_reads_user ON announcement_reads(tenant_id, user_id);

-- Group messages (FR631-FR649)
CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'agent')),
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    mentions TEXT,
    reply_to TEXT,
    agent_response_id TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    deleted_at BIGINT
);

CREATE INDEX idx_group_messages_group ON group_messages(tenant_id, group_id);
CREATE INDEX idx_group_messages_created ON group_messages(tenant_id, group_id, created_at DESC);

-- Message audit log (FR618: 180 days retention)
CREATE TABLE IF NOT EXISTS message_audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id UUID NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('send', 'read', 'recall', 'edit', 'delete', 'pin', 'unpin')),
    message_id TEXT NOT NULL,
    sender_id TEXT,
    recipient_id TEXT,
    content TEXT,
    metadata TEXT,
    operator_id TEXT NOT NULL,
    operator_name TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE INDEX idx_audit_message ON message_audit_logs(message_id);
CREATE INDEX idx_audit_operator ON message_audit_logs(tenant_id, operator_id);
CREATE INDEX idx_audit_created ON message_audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_expires ON message_audit_logs(expires_at);

-- Index for audit cleanup job (simple index on expires_at for cleanup queries)
CREATE INDEX idx_audit_cleanup ON message_audit_logs(expires_at);
