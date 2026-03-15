import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

/**
 * A resilient storage adapter for Zustand's persist middleware.
 * - Uses localStorage on Web.
 * - Uses AsyncStorage on Native, with a safety check for null native modules.
 * - Gracefully fallbacks to an in-memory storage if persistent storage is unavailable.
 */

const memoryStorage: Record<string, string> = {};

const baseStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
        }

        try {
            // AsyncStorage can throw "Native module is null" if not correctly linked
            // or called too early in some environments.
            return await AsyncStorage.getItem(name);
        } catch (error) {
            console.warn(`[storage] Failed to get item "${name}" from AsyncStorage:`, error);
            return memoryStorage[name] || null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(name, value);
                } catch (error) {
                    console.warn(`[storage] LocalStorage full, failing back to memory for "${name}":`, error);
                    memoryStorage[name] = value;
                }
            }
            return;
        }

        try {
            await AsyncStorage.setItem(name, value);
        } catch (error) {
            console.warn(`[storage] Failed to set item "${name}" in AsyncStorage:`, error);
            memoryStorage[name] = value;
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(name);
            }
            return;
        }

        try {
            await AsyncStorage.removeItem(name);
        } catch (error) {
            console.warn(`[storage] Failed to remove item "${name}" from AsyncStorage:`, error);
            delete memoryStorage[name];
        }
    },
};

export const safeStorage = baseStorage;
