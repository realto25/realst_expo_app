// components/CustomSplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationFinish?: () => void;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ 
  onAnimationFinish 
}) => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const floatingAnimation1 = useRef(new Animated.Value(0)).current;
  const floatingAnimation2 = useRef(new Animated.Value(0)).current;
  const floatingAnimation3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
      // Background gradient animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(backgroundAnimation, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(backgroundAnimation, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Floating shapes animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimation1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimation1, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimation2, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimation2, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnimation3, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnimation3, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Logo animation
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Text animation (delayed)
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 600);

      // Progress bar animation (delayed)
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(progressWidth, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: false,
            }),
            Animated.timing(progressWidth, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }, 1000);

      // Auto hide after animations
      setTimeout(() => {
        onAnimationFinish?.();
      }, 3500);
    };

    startAnimations();
  }, []);

  const progressInterpolation = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" translucent />
      
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FF8C42', '#E65100']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Floating Shapes */}
        <View style={styles.floatingShapes}>
          <Animated.View
            style={[
              styles.shape1,
              styles.shape,
              {
                transform: [
                  {
                    translateY: floatingAnimation1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  {
                    rotate: floatingAnimation1.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.shape2,
              styles.shape,
              {
                transform: [
                  {
                    translateY: floatingAnimation2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -30],
                    }),
                  },
                  {
                    rotate: floatingAnimation2.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '-180deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.shape3,
              styles.shape,
              {
                transform: [
                  {
                    translateY: floatingAnimation3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                  {
                    rotate: floatingAnimation3.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '90deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <View style={styles.logoBackground}>
              <Text style={styles.logoText}>
                90<Text style={styles.degreeSymbol}>°</Text>
              </Text>
            </View>
          </Animated.View>

          {/* Brand Text */}
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.brandName}>90 Degree Pride Homes</Text>
            <Text style={styles.brandSubtitle}>Premium Real Estate</Text>
            <Text style={styles.tagline}>Find Your Perfect Home</Text>
          </Animated.View>

          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBar}>
              <Animated.View
                style={[
                  styles.loadingProgress,
                  {
                    width: progressInterpolation,
                  },
                ]}
              />
            </View>
            <Text style={styles.loadingText}>LOADING</Text>
          </View>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  floatingShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shape: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  shape1: {
    width: 60,
    height: 60,
    borderRadius: 12,
    top: height * 0.2,
    left: width * 0.1,
  },
  shape2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    top: height * 0.6,
    right: width * 0.15,
  },
  shape3: {
    width: 80,
    height: 80,
    borderRadius: 20,
    bottom: height * 0.3,
    left: width * 0.15,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B35',
    fontFamily: 'manrope-bold',
  },
  degreeSymbol: {
    fontSize: 24,
    color: '#E65100',
    position: 'absolute',
    top: -8,
    right: -8,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    fontFamily: 'manrope-bold',
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
    marginBottom: 16,
    fontFamily: 'manrope',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
    fontFamily: 'manrope-medium',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  loadingBar: {
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    fontFamily: 'manrope-medium',
  },
  versionText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
    fontFamily: 'manrope',
  },
});

export default CustomSplashScreen;
