import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { ChatSummary, ChatMessage } from '../../types';
import { Colors } from '../../theme';
import { signalRService } from '../../services/signalr';

interface MessengerModuleProps {
  chats: ChatSummary[];
  activeMessages: ChatMessage[];
  currentUserId?: string;
  onSelectChat: (chat: ChatSummary) => void;
  onSendMessage: (chatId: string, text: string) => void;
  selectedChat: ChatSummary | null;
  onBackToChatList: () => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

export const MessengerModule: React.FC<MessengerModuleProps> = ({
  chats,
  activeMessages,
  currentUserId,
  onSelectChat,
  onSendMessage,
  selectedChat,
  onBackToChatList,
  currentTheme = 'dark',
}) => {
  const theme = Colors[currentTheme];
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'clans'>('all');
  const [inputText, setInputText] = useState<string>('');

  const filteredChats = chats.filter((c) => {
    if (filterTab === 'direct') return !c.isClanChat;
    if (filterTab === 'clans') return c.isClanChat;
    return true;
  });

  const handleSend = () => {
    if (!inputText.trim() || !selectedChat) return;
    onSendMessage(selectedChat.id, inputText.trim());
    setInputText('');
  };

  // If a chat is actively selected, render the conversation view
  if (selectedChat) {
    return (
      <View style={[styles.container, { backgroundColor: theme.drawerBg }]}>
        {/* Chat Header */}
        <View style={[styles.chatHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity onPress={onBackToChatList} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: theme.accent }]}>← Назад</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.chatHeaderTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {selectedChat.title}
            </Text>
            <Text style={[styles.chatHeaderSubtitle, { color: theme.textSecondary }]}>
              {selectedChat.isClanChat ? 'Групповой чат клана' : 'Личный диалог / Фильтр-чат'}
            </Text>
          </View>
        </View>

        {/* Message Thread */}
        <FlatList
          data={activeMessages}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUserId;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMe
                    ? [styles.myMessage, { backgroundColor: theme.accent }]
                    : [styles.theirMessage, { backgroundColor: theme.surface, borderColor: theme.border }],
                ]}
              >
                {!isMe && (
                  <Text style={[styles.senderName, { color: theme.accent }]}>{item.senderName}</Text>
                )}
                <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : theme.textPrimary }]}>
                  {item.textContent}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textMuted },
                  ]}
                >
                  {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Здесь пока нет сообщений. Начните диалог!
              </Text>
            </View>
          }
        />

        {/* Send Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.drawerBg }]}
            placeholder="Написать сообщение..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={handleSend}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Chat List View
  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        {(['all', 'direct', 'clans'] as const).map((tab) => {
          const label = tab === 'all' ? 'Все' : tab === 'direct' ? 'Личные' : 'Кланы';
          const isSelected = filterTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isSelected ? theme.accent : 'transparent',
                },
              ]}
              onPress={() => setFilterTab(tab)}
            >
              <Text style={[styles.tabBtnText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Chats List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chatCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => onSelectChat(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.chatAvatar, { backgroundColor: item.isClanChat ? theme.streakOrange : theme.accent }]}>
              <Text style={styles.chatAvatarText}>{item.isClanChat ? '🛡️' : '💬'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.chatCardHeader}>
                <Text style={[styles.chatTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.lastMessageTime && (
                  <Text style={[styles.chatTime, { color: theme.textMuted }]}>
                    {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              <Text style={[styles.lastMessageText, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.lastMessage || 'Нет сообщений'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Диалогов пока нет. Вступайте в кланы или пишите друзьям!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    margin: 12,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarText: {
    fontSize: 18,
  },
  chatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  chatTime: {
    fontSize: 11,
  },
  lastMessageText: {
    fontSize: 13,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  chatHeaderSubtitle: {
    fontSize: 11,
  },
  messagesList: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
