import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { StatusProvider, useStatus } from './context/StatusContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { useMockNearbyDetection } from './utils/mockNearbyDetection';
import WaveAnimation from './components/WaveAnimation';
import { styles } from './styles/screens/HomeScreen.styles';

const MainScreen = () => {
  const { isOpen, toggleStatus, hasMatch, matchColor } = useStatus();
  const { t } = useLanguage();
  useMockNearbyDetection();

  const getStatusMessage = () => {
    if (!isOpen) return t.status.inactive;
    if (hasMatch) return t.status.match;
    return t.status.searching;
  };

  return (
    <View style={[styles.container, { backgroundColor: matchColor }]}>
      <StatusBar barStyle="dark-content" />
      {isOpen && !hasMatch && <WaveAnimation />}
      <View style={styles.content}>
        <Text style={styles.title}>{t.appName}</Text>
        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
        <TouchableOpacity
          style={[styles.button, isOpen && styles.buttonActive]}
          onPress={toggleStatus}
        >
          <Text style={styles.buttonText}>
            {isOpen ? t.button.close : t.button.open}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <StatusProvider>
        <MainScreen />
      </StatusProvider>
    </LanguageProvider>
  );
} 