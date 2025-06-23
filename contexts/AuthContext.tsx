// contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUser, setAuthToken } from '../api/api';

interface AuthContextType {
    user: IUser | null;
    token: string | null;
    login: (userData: IUser, token: string) => Promise<void>;
    logout: () => Promise<void>;
    loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('@CleanWay:user');
                const storedToken = await AsyncStorage.getItem('@CleanWay:token');

                if (storedUser && storedToken) {
                    const parsedUser: IUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setToken(storedToken);
                    setAuthToken(storedToken);
                }
            } catch (error) {
                console.error('Erro ao carregar dados do storage:', error);
            } finally {
                setLoadingAuth(false);
            }
        };
        loadStorageData();
    }, []);

    const login = async (userData: IUser, jwtToken: string) => {
        setUser(userData);
        setToken(jwtToken);
        setAuthToken(jwtToken);
        await AsyncStorage.setItem('@CleanWay:user', JSON.stringify(userData));
        await AsyncStorage.setItem('@CleanWay:token', jwtToken);
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        setAuthToken(null);
        await AsyncStorage.removeItem('@CleanWay:user');
        await AsyncStorage.removeItem('@CleanWay:token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loadingAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};