import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    RefreshControl,
    Alert,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { fetchUserNotes, deleteNote } from '../services/notesApi';
import { useSearchNotes } from '../hooks/useSearchNotes';
import { NoteListItem, Tag } from '../types';
import { Input } from '../../../components/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NoteListScreenProps {
    navigation: any;
}

interface NoteCardProps {
    note: NoteListItem;
    onPress: () => void;
    onLongPress: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onLongPress }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getPreviewText = () => {
        if (note.plainText) {
            return note.plainText.slice(0, 100) + (note.plainText.length > 100 ? '...' : '');
        }
        return 'No content';
    };

    return (
        <TouchableOpacity
            style={styles.noteCard}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.noteHeader}>
                <View style={styles.noteTitleRow}>
                    {note.isPinned && (
                        <Ionicons name="pin" size={14} color="#f59e0b" style={styles.pinIcon} />
                    )}
                    <Text style={styles.noteTitle} numberOfLines={1}>
                        {note.title}
                    </Text>
                </View>
                <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
            </View>

            <Text style={styles.notePreview} numberOfLines={2}>
                {getPreviewText()}
            </Text>

            {note.tags.length > 0 && (
                <View style={styles.tagsRow}>
                    {note.tags.slice(0, 3).map((tag) => (
                        <View
                            key={tag.id}
                            style={[styles.tagChip, { backgroundColor: tag.color }]}
                        >
                            <Text style={styles.tagChipText}>#{tag.name}</Text>
                        </View>
                    ))}
                    {note.tags.length > 3 && (
                        <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

export const NoteListScreen: React.FC<NoteListScreenProps> = ({ navigation }) => {
    const { user } = useAuth();
    const userId = user?.id || 1;

    const [notes, setNotes] = useState<NoteListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchMode, setSearchMode] = useState(false);

    const {
        results: searchResults,
        query: searchQuery,
        isSearching,
        search,
        searchNow,
        clearSearch,
        hasMore,
        loadMore,
    } = useSearchNotes({ userId });

    // Fetch notes
    const loadNotes = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetchUserNotes(userId);
            setNotes(response.notes);
        } catch (error) {
            console.error('Failed to load notes:', error);
            Alert.alert('Error', 'Failed to load notes');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    // Refresh on focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (!searchMode) {
                loadNotes();
            }
        });
        return unsubscribe;
    }, [navigation, loadNotes, searchMode]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        if (searchMode && searchQuery) {
            await searchNow(searchQuery);
        } else {
            await loadNotes();
        }
        setRefreshing(false);
    }, [searchMode, searchQuery, searchNow, loadNotes]);

    // Handle search
    const handleSearch = useCallback((text: string) => {
        if (text.length > 0) {
            setSearchMode(true);
            search(text);
        } else {
            setSearchMode(false);
            clearSearch();
        }
    }, [search, clearSearch]);

    // Handle note press
    const handleNotePress = useCallback((note: NoteListItem) => {
        navigation.navigate('NoteEditor', { noteId: note.id });
    }, [navigation]);

    // Handle note long press (delete)
    const handleNoteLongPress = useCallback((note: NoteListItem) => {
        Alert.alert(
            'Note Options',
            `"${note.title}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNote(note.id);
                            loadNotes();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete note');
                        }
                    },
                },
            ]
        );
    }, [loadNotes]);

    // Handle create new note
    const handleCreateNote = useCallback(() => {
        navigation.navigate('NoteEditor', {});
    }, [navigation]);

    // Display data
    const displayNotes = searchMode ? searchResults : notes;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notes</Text>
                <TouchableOpacity onPress={handleCreateNote} style={styles.addButton}>
                    <Ionicons name="add" size={28} color="#6366f1" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9ca3af" />
                    <Input
                        style={styles.searchInput}
                        placeholder="Search notes..."
                        placeholderTextColor="#9ca3af"
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {isSearching && (
                        <Text style={styles.searchingText}>Searching...</Text>
                    )}
                </View>
            </View>

            {/* Notes List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading notes...</Text>
                </View>
            ) : (
                <FlatList
                    data={displayNotes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <NoteCard
                            note={item}
                            onPress={() => handleNotePress(item)}
                            onLongPress={() => handleNoteLongPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#6366f1"
                        />
                    }
                    onEndReached={searchMode && hasMore ? loadMore : undefined}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color="#e5e7eb" />
                            <Text style={styles.emptyTitle}>
                                {searchMode ? 'No matching notes' : 'No notes yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchMode
                                    ? 'Try a different search term'
                                    : 'Tap the + button to create your first note'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateNote}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    addButton: {
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1a1a1a',
    },
    searchingText: {
        fontSize: 12,
        color: '#6b7280',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    noteCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    noteTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    pinIcon: {
        marginRight: 6,
    },
    noteTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    noteDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    notePreview: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
    },
    tagChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    tagChipText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#fff',
    },
    moreTagsText: {
        fontSize: 11,
        color: '#9ca3af',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default NoteListScreen;
