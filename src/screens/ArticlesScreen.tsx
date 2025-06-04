import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import Card from '../components/Card';
import { truncateText } from '../utils';
import { getAllArticles } from '../utilities/firestoreUtils';

type ArticlesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Articles'>;

// Placeholder image for failed image loads
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const ArticlesScreen = () => {
  const navigation = useNavigation<ArticlesScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        
        // Fetch all articles from Firestore
        const articlesData = await getAllArticles();
        
        // Sort by date (newest first)
        const sortedArticles = articlesData.sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );
        
        setArticles(sortedArticles);
        
        // Extract unique tags
        const tags = Array.from(new Set(sortedArticles.flatMap(article => article.tags)));
        setAllTags(tags);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading articles:', err);
        setError('Failed to load articles. Please try again.');
        setLoading(false);
      }
    };
    
    loadArticles();
  }, []);

  // Filter articles based on search query and active tag
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = activeTag === null || article.tags.includes(activeTag);
    
    return matchesSearch && matchesTag;
  });

  const handleArticlePress = (articleId: string) => {
    navigation.navigate('ArticleDetails', { articleId });
  };

  const handleTagPress = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const articlesData = await getAllArticles();
      const sortedArticles = articlesData.sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
      setArticles(sortedArticles);
      
      // Extract unique tags
      const tags = Array.from(new Set(sortedArticles.flatMap(article => article.tags)));
      setAllTags(tags);
      
      setSearchQuery('');
      setActiveTag(null);
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing articles:', err);
      setError('Failed to refresh articles. Please try again.');
      setLoading(false);
    }
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const renderTagItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.tagItem,
        activeTag === item && styles.activeTagItem,
      ]}
      onPress={() => handleTagPress(item)}
    >
      <Text
        style={[
          styles.tagText,
          activeTag === item && styles.activeTagText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderArticleItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => handleArticlePress(item.id)}
    >
      <Card elevation="small">
        <View style={styles.articleContent}>
          <Image 
            source={{ uri: failedImages[item.id] ? PLACEHOLDER_IMAGE : item.image }} 
            style={styles.articleImage} 
            onError={() => handleImageError(item.id)}
          />
          <View style={styles.articleInfo}>
            <Text style={styles.articleTitle}>{truncateText(item.title, 60)}</Text>
            <Text style={styles.articleSummary}>{truncateText(item.summary, 100)}</Text>
            <View style={styles.articleMeta}>
              <Text style={styles.articleAuthor}>{item.author}</Text>
              <Text style={styles.articleDate}>
                {item.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.articleTags}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.articleTag}>
                  <Text style={styles.articleTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        <FlatList
          data={allTags}
          renderItem={renderTagItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsList}
        />
      </View>

      {/* Articles List */}
      {filteredArticles.length > 0 ? (
        <FlatList
          data={filteredArticles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.articlesList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No articles found</Text>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setSearchQuery('');
              setActiveTag(null);
            }}
          >
            <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  tagsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacing.md,
  },
  tagsList: {
    paddingHorizontal: spacing.md,
  },
  tagItem: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  activeTagItem: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  activeTagText: {
    color: colors.white,
    fontWeight: '600',
  },
  articlesList: {
    padding: spacing.md,
  },
  articleItem: {
    marginBottom: spacing.md,
  },
  articleContent: {
    padding: spacing.md,
  },
  articleImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  articleSummary: {
    fontSize: fontSizes.md,
    color: colors.lightText,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  articleAuthor: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  articleDate: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  articleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  articleTag: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  articleTagText: {
    fontSize: fontSizes.xs,
    color: colors.text,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  noResultsText: {
    fontSize: fontSizes.lg,
    color: colors.lightText,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  clearFiltersButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  clearFiltersButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default ArticlesScreen; 