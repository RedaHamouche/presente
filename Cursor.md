Prompt pour Cursor.ai : Instructions complètes pour HeadsUp
Objectif : Créer une application mobile React Native (Expo) et un backend Node.js avec WebSocket pour le projet "HeadsUp".

Concept : Permettre à deux utilisateurs anonymes proches de se retrouver physiquement grâce à un signal visuel partagé et une flèche directionnelle, sans chat ni photo.

Partie 1 : Backend (Node.js + WebSocket)
Instructions :

Crée un nouveau dossier pour le projet nommé headsup-backend.
Dans ce dossier, initialise un projet Node.js et installe les dépendances nécessaires :
npm init -y
npm install express ws cors haversine-distance
Crée un unique fichier nommé server.js et colle le code suivant. Ce code met en place un serveur WebSocket qui gérera les sessions, la localisation et le matching des utilisateurs en temps réel.

Fichier : server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const haversine = require('haversine-distance');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Base de données en mémoire pour le MVP
let sessions = {}; // Clé: userId, Valeur: { ws, lat, lon, status, matchedWith, patternId, expiresAt }

const MATCHING_RADIUS_METERS = 500;
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

wss.on('connection', (ws) => {
    let userId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            userId = data.userId; // Associer la connexion à un userId

            if (!userId) return;

            // Initialiser ou mettre à jour la session
            if (!sessions[userId]) {
                sessions[userId] = {};
            }
            sessions[userId].ws = ws;
            sessions[userId].expiresAt = Date.now() + SESSION_TIMEOUT_MS;

            switch (data.type) {
                case 'BECOME_AVAILABLE':
                    console.log(`User ${userId} is now available.`);
                    sessions[userId] = {
                        ...sessions[userId],
                        lat: data.location.latitude,
                        lon: data.location.longitude,
                        status: 'available',
                        matchedWith: null,
                        patternId: null,
                    };
                    findAndCreateMatch(userId);
                    break;

                case 'UPDATE_LOCATION':
                    if (sessions[userId]) {
                        sessions[userId].lat = data.location.latitude;
                        sessions[userId].lon = data.location.longitude;
                    }
                    // Informer le match de la nouvelle position
                    if (sessions[userId] && sessions[userId].status === 'matched') {
                        const matchedUserId = sessions[userId].matchedWith;
                        if (sessions[matchedUserId] && sessions[matchedUserId].ws.readyState === WebSocket.OPEN) {
                           sessions[matchedUserId].ws.send(JSON.stringify({
                               type: 'PARTNER_LOCATION_UPDATED',
                               location: { latitude: data.location.latitude, longitude: data.location.longitude }
                           }));
                        }
                    }
                    break;

                case 'BECOME_INVISIBLE':
                    console.log(`User ${userId} is now invisible.`);
                    notifyPartnerAndCloseSession(userId);
                    break;
            }
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });

    ws.on('close', () => {
        if (userId) {
            console.log(`User ${userId} disconnected.`);
            notifyPartnerAndCloseSession(userId);
        }
    });
});

function findAndCreateMatch(currentUserId) {
    const currentUser = sessions[currentUserId];
    if (!currentUser || currentUser.status !== 'available') return;

    for (const otherUserId in sessions) {
        if (otherUserId === currentUserId) continue;

        const otherUser = sessions[otherUserId];
        if (otherUser.status === 'available') {
            const distance = haversine(
                { latitude: currentUser.lat, longitude: currentUser.lon },
                { latitude: otherUser.lat, longitude: otherUser.lon }
            );

            if (distance <= MATCHING_RADIUS_METERS) {
                console.log(`Match found between ${currentUserId} and ${otherUserId}!`);
                const patternId = `pattern_${Date.now()}`;

                // Mettre à jour les deux sessions
                currentUser.status = 'matched';
                currentUser.matchedWith = otherUserId;
                currentUser.patternId = patternId;

                otherUser.status = 'matched';
                otherUser.matchedWith = currentUserId;
                otherUser.patternId = patternId;

                // Envoyer la confirmation de match aux deux utilisateurs
                const matchPayload = {
                    type: 'MATCH_FOUND',
                    partner: { userId: otherUserId, location: { latitude: otherUser.lat, longitude: otherUser.lon } },
                    patternId: patternId,
                };
                currentUser.ws.send(JSON.stringify(matchPayload));

                const otherMatchPayload = {
                    type: 'MATCH_FOUND',
                    partner: { userId: currentUserId, location: { latitude: currentUser.lat, longitude: currentUser.lon } },
                    patternId: patternId,
                };
                otherUser.ws.send(JSON.stringify(otherMatchPayload));

                return; // Arrêter la recherche
            }
        }
    }
}

function notifyPartnerAndCloseSession(userId) {
    const session = sessions[userId];
    if (session) {
        if (session.status === 'matched' && session.matchedWith) {
            const partnerSession = sessions[session.matchedWith];
            if (partnerSession && partnerSession.ws.readyState === WebSocket.OPEN) {
                partnerSession.ws.send(JSON.stringify({ type: 'PARTNER_DISCONNECTED' }));
            }
        }
        delete sessions[userId];
    }
}

// Nettoyage périodique des sessions expirées
setInterval(() => {
    const now = Date.now();
    for (const userId in sessions) {
        if (sessions[userId].expiresAt < now) {
            console.log(`Session for ${userId} expired.`);
            notifyPartnerAndCloseSession(userId);
        }
    }
}, 60 * 1000);


const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
Partie 2 : Frontend (React Native + Expo)
Instructions :

Crée un nouveau projet Expo nommé headsup-frontend.
npx create-expo-app headsup-frontend
Navigue dans le dossier et installe les dépendances requises :
cd headsup-frontend
npx expo install expo-location expo-sensors @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack
npm install @expo/vector-icons
Crée les dossiers suivants à la racine du projet : screens, components.
Maintenant, crée les fichiers suivants avec le contenu fourni.

Fichier : App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './screens/MainScreen';
import MatchingScreen from './screens/MatchingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Matching" component={MatchingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

Fichier : screens/MainScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, AppState } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

// IMPORTANT: Remplacez par l'adresse IP de votre machine locale où tourne le backend
// N'utilisez PAS localhost, votre téléphone ne pourra pas s'y connecter.
const WEBSOCKET_URL = 'ws://192.168.1.10:8080'; 

export default function MainScreen({ navigation }) {
    const [status, setStatus] = useState('invisible');
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [userId, setUserId] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location.coords);

            let storedUserId = await AsyncStorage.getItem('userId');
            if (!storedUserId) {
                storedUserId = `user_${Date.now()}`;
                await AsyncStorage.setItem('userId', storedUserId);
            }
            setUserId(storedUserId);
        })();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                goInvisible();
            }
        });
        return () => subscription.remove();
    }, []);

    const connectWebSocket = () => {
        ws.current = new WebSocket(WEBSOCKET_URL);
        ws.current.onopen = () => console.log('WebSocket Connected');
        ws.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'MATCH_FOUND') {
                navigation.navigate('Matching', { matchData: data });
            }
        };
        ws.current.onerror = (e) => console.log(e.message);
        ws.current.onclose = () => console.log('WebSocket Disconnected');
    };

    const sendMessage = (data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ ...data, userId }));
        }
    };

    const goAvailable = () => {
        if (!location || !userId) return;
        connectWebSocket();
        setTimeout(() => { // Laisse le temps à la connexion de s'établir
            sendMessage({ type: 'BECOME_AVAILABLE', location });
            setStatus('available');
        }, 500);
    };

    const goInvisible = () => {
        sendMessage({ type: 'BECOME_INVISIBLE' });
        if (ws.current) {
            ws.current.close();
        }
        setStatus('invisible');
    };

    if (errorMsg) {
        return <View style={styles.container}><Text style={styles.text}>{errorMsg}</Text></View>;
    }
    if (!location || !userId) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>HeadsUp</Text>
            <TouchableOpacity onPress={status === 'invisible' ? goAvailable : goInvisible} style={[styles.button, status === 'available' ? styles.availableButton : styles.invisibleButton]}>
                <Feather name={status === 'available' ? 'eye-off' : 'eye'} size={24} color="white" />
                <Text style={styles.buttonText}>{status === 'available' ? 'Devenir Invisible' : 'Devenir Disponible'}</Text>
            </TouchableOpacity>
            <Text style={styles.statusText}>
                {status === 'available' ? 'En attente de connexion...' : 'Vous êtes invisible.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
    title: { fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 40 },
    button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, marginBottom: 20 },
    invisibleButton: { backgroundColor: '#581c87' },
    availableButton: { backgroundColor: '#be123c' },
    buttonText: { color: 'white', fontSize: 18, marginLeft: 10, fontWeight: '600' },
    statusText: { color: 'gray', fontSize: 16 },
    text: { color: 'white' }
});

Fichier : screens/MatchingScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CompassArrow from '../components/CompassArrow';
import * as Location from 'expo-location';

// IMPORTANT: Remplacez par l'adresse IP de votre machine locale où tourne le backend
const WEBSOCKET_URL = 'ws://192.168.1.10:8080'; 

export default function MatchingScreen({ route, navigation }) {
    const { matchData } = route.params;
    const [currentLocation, setCurrentLocation] = useState(null);
    const [partnerLocation, setPartnerLocation] = useState(matchData.partner.location);
    const ws = useRef(null);

    useEffect(() => {
        const startLocationUpdates = async () => {
            await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
                (location) => {
                    setCurrentLocation(location.coords);
                    sendMessage({ type: 'UPDATE_LOCATION', location: location.coords });
                }
            );
        };
        startLocationUpdates();
        connectWebSocket();

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);
    
    const connectWebSocket = () => {
        ws.current = new WebSocket(WEBSOCKET_URL);
        ws.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if(data.type === 'PARTNER_LOCATION_UPDATED') {
                setPartnerLocation(data.location);
            } else if (data.type === 'PARTNER_DISCONNECTED') {
                navigation.navigate('Main');
            }
        };
    };
    
    const sendMessage = (data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ ...data, userId: matchData.partner.userId === 'user_a' ? 'user_b' : 'user_a' })); // This needs a real userId
        }
    };

    const goInvisible = () => {
        sendMessage({ type: 'BECOME_INVISIBLE' });
        navigation.navigate('Main');
    };

    if (!currentLocation) {
        return <View style={styles.container}><Text style={styles.infoText}>Acquiring location...</Text></View>;
    }

    // A simple visual pattern based on patternId
    const patternStyle = {
        backgroundColor: `#${matchData.patternId.slice(-6)}33` // Use last 6 chars of ID for a color
    };

    return (
        <View style={[styles.container, patternStyle]}>
            <Text style={styles.infoText}>Vous êtes connecté !</Text>
            <Text style={styles.subInfoText}>Suivez la flèche.</Text>
            
            <CompassArrow
                currentLocation={currentLocation}
                targetLocation={partnerLocation}
            />
            
            <TouchableOpacity onPress={goInvisible} style={styles.disconnectButton}>
                <Text style={styles.disconnectButtonText}>Se déconnecter</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#000' },
    infoText: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' },
    subInfoText: { fontSize: 18, color: 'gray', textAlign: 'center', marginBottom: 40 },
    disconnectButton: { backgroundColor: '#be123c', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
    disconnectButtonText: { color: 'white', fontSize: 16, fontWeight: '600' }
});

Fichier : components/CompassArrow.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { Feather } from '@expo/vector-icons';
import haversine from 'haversine-distance';

export default function CompassArrow({ currentLocation, targetLocation }) {
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        const subscription = Magnetometer.addListener(data => {
            const { x, y } = data;
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle = (angle + 360) % 360;
            setHeading(360 - angle); // Adjust for true north
        });
        return () => subscription.remove();
    }, []);

    const calculateBearing = () => {
        const lat1 = currentLocation.latitude * Math.PI / 180;
        const lon1 = currentLocation.longitude * Math.PI / 180;
        const lat2 = targetLocation.latitude * Math.PI / 180;
        const lon2 = targetLocation.longitude * Math.PI / 180;
        const dLon = lon2 - lon1;

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    };

    const bearing = calculateBearing();
    const rotation = bearing - heading;
    const distance = haversine(currentLocation, targetLocation);

    return (
        <View style={styles.container}>
            <View style={[styles.arrowContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
                <Feather name="navigation" size={80} color="white" />
            </View>
            <Text style={styles.distanceText}>
                {distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    arrowContainer: { 
        width: 150, 
        height: 150, 
        borderRadius: 75,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 20
    },
    distanceText: { fontSize: 22, fontWeight: 'bold', color: 'white' }
});
Partie 3 : Comment tout exécuter
Instructions pour l'utilisateur final :

Démarrer le backend :

Ouvrez un terminal dans le dossier headsup-backend.
Exécutez node server.js.
Notez l'adresse IP de votre machine sur votre réseau local (ex: 192.168.1.10).
Configurer et démarrer le frontend :

Ouvrez les fichiers screens/MainScreen.js et screens/MatchingScreen.js.
TRÈS IMPORTANT : Remplacez la valeur de WEBSOCKET_URL par l'adresse IP de votre backend (ex: 'ws://192.168.1.10:8080'). N'utilisez pas localhost.
Ouvrez un terminal dans le dossier headsup-frontend.
Exécutez npx expo start.
Scannez le QR code avec l'application Expo Go sur votre téléphone physique (pas un simulateur si vous voulez tester la boussole). Vous aurez besoin de deux téléphones sur le même réseau Wi-Fi pour tester le matching.