import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStats, checkStreakStatus } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState({ totalTests: 0, correctAnswers: 0, totalQuestions: 0 });
  const [streak, setStreak] = useState({ currentStreak: 0 });

  // Get first name from user
  const firstName = user?.name?.split(' ')[0] || 'Aspirant';

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const [statsData, streakData] = await Promise.all([
      getStats(),
      checkStreakStatus(),
    ]);
    setStats(statsData);
    setStreak(streakData);
  };

  const avgScore = stats.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  const mainFeatures = [

    {
      id: 'articles',
      icon: 'newspaper-outline',
      title: 'News Feed',
      desc: 'Current affairs & more',
      gradient: ['#8B5CF6', '#7C3AED'],
      screen: 'Articles',
    },
    {
      id: 'aimcq',
      icon: 'create-outline',
      title: 'MCQ Generator',
      desc: 'Generate by topic',
      gradient: ['#007AFF', '#0055D4'],
      screen: 'AIMCQGenerator',
    },
    {
      id: 'aimindmap',
      icon: 'git-network-outline',
      title: 'AI Mind Map',
      desc: 'AI-powered diagrams',
      gradient: ['#007AFF', '#0055D4'],
      screen: 'AIMindMap',
    },

    {
      id: 'pdfmcq',
      icon: 'document-attach-outline',
      title: 'PDF to MCQ',
      desc: 'Generate from PDF',
      gradient: ['#FF2D55', '#FF375F'],
      screen: 'PDFMCQGenerator',
    },

    {
      id: 'essay',
      icon: 'document-text-outline',
      title: 'AI Essay Writing',
      desc: 'Practice essay topics',
      gradient: ['#FF9500', '#E68600'],
      screen: 'Essay',
    },
    {
      id: 'mcq',
      icon: 'sparkles-outline',
      title: 'Generate MCQs',
      desc: 'Create custom questions',
      gradient: ['#007AFF', '#0055D4'],
      screen: 'Config',
    },


    {
      id: 'bank',
      icon: 'folder-outline',
      title: 'Question Bank',
      desc: 'Your saved questions',
      gradient: ['#5856D6', '#4845B5'],
      screen: 'QuestionBank',
    },

    {
      id: 'reference',
      icon: 'library-outline',
      title: 'Visual Reference',
      desc: 'Maps, timelines & more',
      gradient: ['#FF6B6B', '#EE5A5A'],
      screen: 'Reference',
    },
    {
      id: 'mindmap',
      icon: 'git-network-outline',
      title: 'Mind Map',
      desc: 'Visual knowledge graph',
      gradient: ['#06B6D4', '#0891B2'],
      screen: 'MindMap',
    },
    {
      id: 'progress',
      icon: 'stats-chart-outline',
      title: 'Progress',
      desc: 'Charts & analytics',
      gradient: ['#34C759', '#28A745'],
      screen: 'Progress',
    },

    {
      id: 'notes',
      icon: 'document-text-outline',
      title: 'Notes',
      desc: 'Create & organize notes',
      gradient: ['#6366F1', '#8B5CF6'],
      screen: 'Notes',
    },
    {
      id: 'roadmap',
      icon: 'map-outline',
      title: 'Study Roadmap',
      desc: 'Your complete syllabus',
      gradient: ['#667eea', '#764ba2'],
      screen: 'Roadmap',
    },
    {
      id: 'daily',
      icon: 'calendar-outline',
      title: "Today's Plan",
      desc: 'Daily study goals',
      gradient: ['#11998e', '#38ef7d'],
      screen: 'DailyPlan',
    },
    {
      id: 'questionpaper',
      icon: 'document-text-outline',
      title: "Question Paper",
      desc: 'Practice Questions',
      gradient: ['#F59E0B', '#D97706'], // Amber/Orange gradient
      screen: 'QuestionSetList',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding || 20 }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Hello, {firstName} 👋</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>UPSC Prep</Text>
            </View>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Your daily preparation companion</Text>
        </View>

        {/* Streak Banner */}
        {streak.currentStreak > 0 && (
          <TouchableOpacity
            style={[styles.streakBanner, { backgroundColor: theme.colors.warning }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={styles.streakFire}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakText}>{streak.currentStreak} Day Streak!</Text>
              <Text style={styles.streakSubtext}>Keep it going!</Text>
            </View>
            <Text style={styles.streakArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Stats Card */}


        {/* Main Features */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Start Learning</Text>
        <View style={[styles.grid, (isWeb && width > 600) && styles.gridWeb]}>
          {mainFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                { backgroundColor: theme.colors.surface },
                (isWeb && width > 600) && styles.featureCardWeb
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(feature.screen, { type: feature.id })}
            >
              <LinearGradient
                colors={feature.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <Ionicons name={feature.icon} size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>{feature.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Topics */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Popular Topics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
          {['Indian Polity', 'Geography', 'Economy', 'History', 'Science & Tech', 'Environment'].map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.topicChip, { backgroundColor: theme.colors.surface }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Config', { topic })}
            >
              <Text style={[styles.topicText, { color: theme.colors.primary }]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('QuestionBank')}
          >
            <View style={[styles.quickActionIconWrapper, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
              <Ionicons name="library" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.quickActionInfo}>
              <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>Practice from Bank</Text>
              <Text style={[styles.quickActionDesc, { color: theme.colors.textSecondary }]}>Review your saved questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={[styles.quickActionIconWrapper, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
              <Ionicons name="trending-up" size={24} color={theme.colors.success} />
            </View>
            <View style={styles.quickActionInfo}>
              <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>View Progress</Text>
              <Text style={[styles.quickActionDesc, { color: theme.colors.textSecondary }]}>Track your improvement</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Motivational Card */}
        <View style={[styles.motivationCard, { backgroundColor: isDark ? theme.colors.surface : '#1C1C1E' }]}>
          <Text style={styles.motivationQuote}>
            "Success is not final, failure is not fatal: it is the courage to continue that counts."
          </Text>
          <Text style={[styles.motivationAuthor, { color: theme.colors.textSecondary }]}>— Winston Churchill</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // settingsIcon removed - using Ionicons settings-outline
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  streakBanner: {
    backgroundColor: '#FF9500',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakFire: {
    fontSize: 32,
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  streakSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  streakArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  gridWeb: {
    gap: 16,
    justifyContent: 'flex-start',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  featureCardWeb: {
    width: 180,
    marginBottom: 0,
  },
  featureGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    // Icon styles handled by Ionicons component
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  topicsScroll: {
    marginBottom: 28,
  },
  topicChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topicText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    letterSpacing: -0.3,
  },
  quickActions: {
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  quickActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionInfo: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  quickActionDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  // quickActionArrow removed - using Ionicons chevron-forward
  motivationCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  motivationQuote: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  motivationAuthor: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 12,
  },
});
