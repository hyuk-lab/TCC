// contexts/AlertContext.tsx (Exemplo de como deveria ser para evitar o erro)

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AlertContextType {
    showAlert: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertState {
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [alertState, setAlertState] = useState<AlertState>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
        setAlertState({ visible: true, title, message, type });
    };

    const onClose = () => {
        setAlertState((prev) => ({ ...prev, visible: false }));
    };

    const getColor = () => {
        switch (alertState.type) {
            case 'success':
                return '#4CAF50';
            case 'error':
                return '#F44336';
            case 'info':
                return '#2196F3';
            default:
                return '#2196F3';
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children} {/* O children deve ser sempre um ReactNode, que pode incluir strings, mas o erro sugere que algo está sendo renderizado diretamente sem <Text> */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={alertState.visible}
                onRequestClose={onClose}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertContainer}>
                        <View style={[styles.alertHeader, { backgroundColor: getColor() }]}>
                            <Text style={styles.alertTitle}>{alertState.title}</Text>
                        </View>
                        <View style={styles.alertBody}>
                            <Text style={styles.alertMessage}>{alertState.message}</Text>
                            <TouchableOpacity style={styles.alertButton} onPress={onClose}>
                                <Text style={styles.alertButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    alertOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    alertContainer: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
    },
    alertHeader: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    alertTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    alertBody: {
        padding: 20,
        alignItems: 'center',
    },
    alertMessage: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    alertButton: {
        backgroundColor: '#3A7CA5',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    alertButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});