import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type AlertType = 'success' | 'error' | 'info';

interface AlertContextData {
    showAlert: (title: string, message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<AlertType>('info');

    const showAlert = (title: string, message: string, type: AlertType = 'info') => {
        setTitle(title);
        setMessage(message);
        setType(type);
        setVisible(true);
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#3A7CA5';
            case 'error': return '#E74C3C';
            case 'info': return '#3498DB';
            default: return '#3A7CA5';
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertContainer}>
                        <View style={[styles.alertHeader, { backgroundColor: getColor() }]}>
                            <Text style={styles.alertTitle}>{title}</Text>
                        </View>
                        <View style={styles.alertBody}>
                            <Text style={styles.alertMessage}>{message}</Text>
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: getColor() }]}
                                onPress={() => setVisible(false)}
                            >
                                <Text style={styles.alertButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);

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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    alertHeader: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    alertBody: {
        padding: 20,
    },
    alertMessage: {
        fontSize: 16,
        color: '#2E4052',
        marginBottom: 20,
        textAlign: 'center',
    },
    alertButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    alertButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});