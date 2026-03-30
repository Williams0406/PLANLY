import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing } from '../../theme';

const SLIDES = [
  {
    icon: 'people',
    title: 'Tu grupo, más alineado',
    subtitle: 'Planes claros. Todos enterados.',
    accent: '#22C55E',
  },
  {
    icon: 'wallet',
    title: 'Tus gastos, en orden',
    subtitle: 'Sin enredos. Sin discusiones.',
    accent: '#06B6D4',
  },
  {
    icon: 'compass',
    title: 'Tu viaje, mejor pensado',
    subtitle: 'Ideas, servicios y ritmo en un solo lugar.',
    accent: '#F59E0B',
  },
];

export default function WelcomeScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(24)).current;
  const cardAnim = useRef(new Animated.Value(0.94)).current;
  const dotsAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(riseAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    animateDot(0);
  }, []);

  const animateDot = (index) => {
    dotsAnim.forEach((dot, i) => {
      Animated.timing(dot, {
        toValue: i === index ? 1 : 0,
        duration: 260,
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
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Register');
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#07111F', '#0F172A', '#13283B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.glowTop, { backgroundColor: `${slide.accent}22` }]} />
      <View style={[styles.glowBottom, { backgroundColor: `${slide.accent}18` }]} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: riseAnim }],
          },
        ]}
      >
        <View style={styles.topBlock}>
          <View style={styles.brandRow}>
            <View style={[styles.logoWrap, { borderColor: `${slide.accent}55` }]}>
              <Image
                source={require('../../../assets/images/LogoIcon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Planly</Text>
          </View>

          <Animated.View
            style={[
              styles.heroCard,
              {
                transform: [{ scale: cardAnim }],
              },
            ]}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: `${slide.accent}18` }]}>
              <Ionicons name={slide.icon} size={42} color={slide.accent} />
            </View>

            <Text style={styles.featureTitle}>{slide.title}</Text>
            <Text style={styles.featureSubtitle}>{slide.subtitle}</Text>

            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>1</Text>
                <Text style={styles.miniStatLabel}>solo lugar</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>+</Text>
                <Text style={styles.miniStatLabel}>más orden</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>0</Text>
                <Text style={styles.miniStatLabel}>caos</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.bottomBlock}>
          <View style={styles.dotsRow}>
            {SLIDES.map((item, i) => (
              <TouchableOpacity key={item.title} onPress={() => goToSlide(i)} activeOpacity={0.8}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: dotsAnim[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 30],
                      }),
                      backgroundColor: dotsAnim[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255,255,255,0.18)', slide.accent],
                      }),
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: slide.accent }]}
              onPress={handleNext}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>
                {currentSlide < SLIDES.length - 1 ? 'Seguir' : 'Empezar'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#07111F" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={18} color="#D9F3F8" />
              <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowTop: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -120,
    right: -120,
  },
  glowBottom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -40,
    left: -90,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 68,
    paddingBottom: 34,
  },
  topBlock: {
    gap: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  heroCard: {
    borderRadius: 32,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  featureTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    textAlign: 'center',
  },
  featureSubtitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.74)',
    textAlign: 'center',
  },
  miniStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xl,
  },
  miniStat: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  miniStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  miniStatLabel: {
    marginTop: 4,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.56)',
  },
  bottomBlock: {
    gap: spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: radius.full,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#07111F',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: '#E2F8FB',
    fontSize: 15,
    fontWeight: '600',
  },
});
