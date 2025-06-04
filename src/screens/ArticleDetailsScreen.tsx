import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Article } from '../types';
import { colors, fontSizes, spacing, borderRadius, shadows } from '../theme';
import { getArticleById, getAllArticles } from '../utilities/firestoreUtils';

type ArticleDetailsRouteProp = RouteProp<RootStackParamList, 'ArticleDetails'>;
type ArticleDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ArticleDetails'>;

// Placeholder image for failed image loads
const PLACEHOLDER_IMAGE = 'https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg';

const ArticleDetailsScreen = () => {
  const route = useRoute<ArticleDetailsRouteProp>();
  const navigation = useNavigation<ArticleDetailsNavigationProp>();
  const { articleId } = route.params;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadArticleData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch article details
        const articleData = await getArticleById(articleId);
        
        if (!articleData) {
          setError('Article not found');
          setLoading(false);
          return;
        }
        
        setArticle(articleData);
        
        // Fetch related articles
        const allArticles = await getAllArticles();
        
        // Filter for related articles (exclude current article and limit to those sharing tags)
        const related = allArticles
          .filter(a => 
            a.id !== articleId && 
            a.tags.some(tag => articleData.tags.includes(tag))
          )
          .slice(0, 3);
        
        setRelatedArticles(related);
        setLoading(false);
      } catch (err) {
        console.error('Error loading article:', err);
        setError('Failed to load article. Please try again.');
        setLoading(false);
      }
    };
    
    loadArticleData();
  }, [articleId]);

  const handleShare = async () => {
    if (!article) return;
    
    try {
      await Share.share({
        message: `Check out this article: ${article.title}\n\n${article.summary}\n\nRead more in the AgriSaviya app!`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRelatedArticleImageError = (id: string) => {
    // We can't change the array directly, so we make a copy with the image replaced
    setRelatedArticles(prevArticles => 
      prevArticles.map(article => 
        article.id === id 
          ? { ...article, image: PLACEHOLDER_IMAGE } 
          : article
      )
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Article not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Split the content into paragraphs for better readability
  const paragraphs = article.content.split('\n\n').filter(p => p.trim() !== '');

  const formattedDate = article.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: imageError ? PLACEHOLDER_IMAGE : article.image }} 
          style={styles.image} 
          onError={handleImageError}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.authorDateContainer}>
              <Text style={styles.author}>{article.author}</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.summary}>{article.summary}</Text>

          <View style={styles.divider} />

          <View style={styles.articleContent}>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>

          {relatedArticles.length > 0 && (
            <View style={styles.relatedArticlesContainer}>
              <Text style={styles.relatedArticlesTitle}>Related Articles</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {relatedArticles.map((relatedArticle) => (
                  <TouchableOpacity
                    key={relatedArticle.id}
                    style={styles.relatedArticleCard}
                    onPress={() => {
                      navigation.replace('ArticleDetails', {
                        articleId: relatedArticle.id,
                      });
                    }}
                  >
                    <Image
                      source={{ uri: relatedArticle.image }}
                      style={styles.relatedArticleImage}
                      onError={() => handleRelatedArticleImageError(relatedArticle.id)}
                    />
                    <View style={styles.relatedArticleInfo}>
                      <Text style={styles.relatedArticleTitle} numberOfLines={2}>
                        {relatedArticle.title}
                      </Text>
                      <Text style={styles.relatedArticleAuthor}>
                        {relatedArticle.author}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.backButtonContainer}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonIcon}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorDateContainer: {
    flex: 1,
  },
  author: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  date: {
    fontSize: fontSizes.sm,
    color: colors.lightText,
  },
  shareButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: fontSizes.xs,
    color: colors.text,
  },
  summary: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginBottom: spacing.lg,
  },
  articleContent: {
    marginBottom: spacing.xl,
  },
  paragraph: {
    fontSize: fontSizes.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  relatedArticlesContainer: {
    marginTop: spacing.lg,
  },
  relatedArticlesTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  relatedArticleCard: {
    width: 200,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  relatedArticleImage: {
    width: '100%',
    height: 120,
  },
  relatedArticleInfo: {
    padding: spacing.sm,
  },
  relatedArticleTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  relatedArticleAuthor: {
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  backButtonContainer: {
    position: 'absolute',
    marginTop: 20,
    top: spacing.lg,
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  backButtonIcon: {
    fontSize: fontSizes.xl,
    color: colors.text,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default ArticleDetailsScreen; 