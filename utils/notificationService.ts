// src/utils/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura o handler para notificações em primeiro plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Solicita permissões de notificação
export async function requestNotificationPermissions() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.warn('Permissão para notificações não foi concedida! Você não receberá lembretes de agendamento.');
        return false;
    }
    return true;
}

// Agenda uma notificação para um agendamento
// Agora recebe um objeto Date para `appointmentDateTime`
export async function scheduleAppointmentNotification(
    appointmentId: number,
    serviceName: string,
    appointmentDateTime: Date // Agora espera um objeto Date
) {
    const now = new Date();
    // Agenda a notificação para 30 minutos antes do agendamento
    const notificationTime = new Date(appointmentDateTime.getTime() - (30 * 60 * 1000));

    // Garante que a notificação seja agendada para um horário futuro
    if (notificationTime.getTime() < now.getTime()) {
        console.warn(`Notificação para o agendamento ${appointmentId} seria no passado ou muito em breve. Não agendada.`);
        return null;
    }

    const content: Notifications.NotificationContentInput = {
        title: "Lembrete de Agendamento CleanWay!",
        body: `Seu agendamento para ${serviceName} está chegando em 30 minutos, às ${appointmentDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} em ${appointmentDateTime.toLocaleDateString('pt-BR')}!`,
        data: { appointmentId: appointmentId }, // Anexa o ID do agendamento para referência futura
    };

    // Agenda a notificação
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
                type: 'calendar', // CORREÇÃO: Usando a string literal 'calendar'
                year: notificationTime.getFullYear(),
                month: notificationTime.getMonth(),
                day: notificationTime.getDate(),
                hour: notificationTime.getHours(),
                minute: notificationTime.getMinutes(),
                repeats: false, // Não repete
            } as Notifications.CalendarTriggerInput, // Assegura o tipo para o TypeScript
            identifier: String(appointmentId), // Usa o ID do agendamento como identificador único
        });
        console.log(`Notificação agendada para o agendamento ${appointmentId} com ID: ${notificationId}`);
        return notificationId;
    } catch (error) {
        console.error(`Falha ao agendar notificação para ${appointmentId}:`, error);
        return null;
    }
}

// Cancela uma notificação agendada
export async function cancelAppointmentNotification(appointmentId: number) {
    try {
        await Notifications.cancelScheduledNotificationAsync(String(appointmentId));
        console.log(`Notificação para o agendamento ${appointmentId} cancelada.`);
    } catch (error) {
        console.error(`Falha ao cancelar notificação para ${appointmentId}:`, error);
    }
}
