import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Dimensions, StatusBar, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🧭',
    title: 'Organiza viajes\ngrupales',
    subtitle: 'Coordina actividades y participantes fácilmente desde un solo lugar',
    color: '#06B6D4',
  },
  {
    emoji: '💰',
    title: 'Controla gastos\nsin discusiones',
    subtitle: 'División automática y transparencia total en cada gasto compartido',
    color: '#84CC16',
  },
  {
    emoji: '✨',
    title: 'Descubre\nexperiencias',
    subtitle: 'Explora actividades, restaurantes y tours cerca de tu destino',
    color: '#8B5CF6',
  },
];

export default function WelcomeScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const dotsAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animación inicial
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    animateDot(0);
  }, []);

  const animateDot = (index) => {
    dotsAnim.forEach((dot, i) => {
      Animated.timing(dot, {
        toValue: i === index ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  };

  const goToSlide = (index) => {
    Haptics.selectionAsync();
    setCurrentSlide(index);
    animateDot(index);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Register');
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#0F172A', slide.color + '40']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Círculos decorativos */}
      <View style={[styles.circle1, { backgroundColor: slide.color + '15' }]} />
      <View style={[styles.circle2, { backgroundColor: slide.color + '10' }]} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: logoScale }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={[styles.logoIcon, { borderColor: slide.color + '60' }]}>
            <Text style={styles.logoEmoji}>🗺️</Text>
          </View>
          <Text style={styles.logoText}>Planly</Text>
        </View>

        {/* Slide content */}
        <View style={styles.slideContent}>
          <Text style={styles.slideEmoji}>{slide.emoji}</Text>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotsAnim[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 24],
                    }),
                    backgroundColor: dotsAnim[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255,255,255,0.3)', slide.color],
                    }),
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Botones */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: slide.color }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {currentSlide < SLIDES.length - 1 ? 'Siguiente' : 'Comenzar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.btnSecondaryText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.slogan}>Organiza · Divide · Disfruta</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circle1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: 50,
    left: -80,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 70,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  logoEmoji: { fontSize: 22 },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  slideContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  slideEmoji: { fontSize: 80 },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
  },
  slideSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttons: { gap: spacing.sm },
  btnPrimary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  slogan: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
  },
});