import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDevices: 0,
    blockedDevices: 0,
    suspiciousActivities: 0,
    lastActivity: null,
  });

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;

      try {
        // Obtener información del usuario
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const devicesList = [];
        let blockedCount = 0;
        let lastActivityTime = null;

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Crear un dispositivo para el usuario
          const deviceData = {
            id: "device-" + auth.currentUser.uid,
            deviceName: "Mi dispositivo móvil",
            brand: userData.deviceInfo?.brand || "Smartphone",
            modelName: userData.deviceInfo?.modelName || "Android",
            osName: userData.deviceInfo?.osName || "Android",
            osVersion: userData.deviceInfo?.osVersion || "Última versión",
            deviceBlocked: userData.deviceBlocked || false,
            lastActivity: userData.lastActivity || new Date().toISOString(),
            blockedAt: userData.blockedAt,
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
          };

          devicesList.push(deviceData);

          if (deviceData.deviceBlocked) {
            blockedCount++;
          }

          lastActivityTime = userData.lastActivity || deviceData.lastActivity;
        }

        setDevices(devicesList);

        // Obtener eventos de seguridad recientes
        const eventsQuery = query(
          collection(db, "securityEvents"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc"),
          limit(5)
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = [];
        let suspiciousCount = 0;

        eventsSnapshot.forEach((doc) => {
          const eventData = { id: doc.id, ...doc.data() };
          eventsList.push(eventData);

          if (eventData.type === "suspicious_activity") {
            suspiciousCount++;
          }
        });

        setSecurityEvents(eventsList);

        // Actualizar estadísticas
        setStats({
          totalDevices: devicesList.length > 0 ? 1 : 0, // Forzar a 1 si hay al menos un dispositivo
          blockedDevices: blockedCount,
          suspiciousActivities: suspiciousCount,
          lastActivity: lastActivityTime || new Date().toISOString(),
        });

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos del dispositivo:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.currentUser, db]);

  // Función para formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Función para obtener el color según el tipo de evento
  const getEventColor = (eventType) => {
    switch (eventType) {
      case "suspicious_activity":
        return "#FFC107"; // Amarillo (warning)
      case "device_blocked":
        return "#DC3545"; // Rojo (danger)
      case "device_unblocked":
        return "#28A745"; // Verde (success)
      case "remote_command":
        return "#17A2B8"; // Azul (info)
      default:
        return "#6C757D"; // Gris (secondary)
    }
  };

  // Función para obtener el nombre legible del tipo de evento
  const getEventTypeName = (eventType) => {
    switch (eventType) {
      case "suspicious_activity":
        return "Actividad sospechosa";
      case "device_blocked":
        return "Dispositivo bloqueado";
      case "device_unblocked":
        return "Dispositivo desbloqueado";
      case "remote_command":
        return "Comando remoto";
      case "admin_enabled":
        return "Admin habilitado";
      case "admin_disabled":
        return "Admin deshabilitado";
      case "password_failed":
        return "Intento fallido";
      default:
        return eventType;
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Cargando dashboard...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <DashboardContainer>
      <PageHeader>
        <h1>Dashboard</h1>
        <p>Bienvenido al panel de control de SecureWipe</p>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon color="#007BFF">
            <DevicesIcon />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalDevices}</StatValue>
            <StatLabel>Dispositivos registrados</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#DC3545">
            <BlockedIcon />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.blockedDevices}</StatValue>
            <StatLabel>Dispositivos bloqueados</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#FFC107">
            <WarningIcon />
          </StatIcon>
          <StatContent>
            <StatValue>{stats.suspiciousActivities}</StatValue>
            <StatLabel>Actividades sospechosas</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#17A2B8">
            <TimeIcon />
          </StatIcon>
          <StatContent>
            <StatValue>{formatDate(stats.lastActivity)}</StatValue>
            <StatLabel>Última actividad</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <DevicesSection>
          <SectionHeader>
            <h2>Mis dispositivos</h2>
            <ViewAllLink to="/devices">Ver todos</ViewAllLink>
          </SectionHeader>

          {devices.length === 0 ? (
            <EmptyState>
              <p>No tienes dispositivos registrados</p>
              <small>
                Descarga la aplicación móvil para registrar un dispositivo
              </small>
            </EmptyState>
          ) : (
            <DevicesList>
              {devices.slice(0, 3).map((device) => (
                <DeviceCard key={device.id} to={`/devices/${device.id}`}>
                  <DeviceIcon>
                    <PhoneIcon />
                  </DeviceIcon>
                  <DeviceInfo>
                    <DeviceName>
                      {device.deviceName ||
                        device.modelName ||
                        "Dispositivo sin nombre"}
                    </DeviceName>
                    <DeviceDetails>
                      {device.brand} {device.modelName}
                    </DeviceDetails>
                    <DeviceLastSeen>
                      Última conexión: {formatDate(device.lastActivity)}
                    </DeviceLastSeen>
                  </DeviceInfo>
                  <DeviceStatus blocked={device.deviceBlocked}>
                    {device.deviceBlocked ? "Bloqueado" : "Activo"}
                  </DeviceStatus>
                </DeviceCard>
              ))}
            </DevicesList>
          )}
        </DevicesSection>

        <EventsSection>
          <SectionHeader>
            <h2>Eventos recientes</h2>
          </SectionHeader>

          {securityEvents.length === 0 ? (
            <EmptyState>
              <p>No hay eventos de seguridad recientes</p>
              <small>Los eventos aparecerán aquí cuando ocurran</small>
            </EmptyState>
          ) : (
            <EventsList>
              {securityEvents.map((event) => (
                <EventItem key={event.id}>
                  <EventTypeIndicator color={getEventColor(event.type)} />
                  <EventInfo>
                    <EventType>{getEventTypeName(event.type)}</EventType>
                    <EventDescription>{event.description}</EventDescription>
                    <EventMeta>
                      <EventDevice>{event.deviceName}</EventDevice>
                      <EventTime>{formatDate(event.timestamp)}</EventTime>
                    </EventMeta>
                  </EventInfo>
                </EventItem>
              ))}
            </EventsList>
          )}
        </EventsSection>
      </ContentGrid>
    </DashboardContainer>
  );
};

// Estilos
const DashboardContainer = styled.div`
  padding: 20px;
`;

const PageHeader = styled.div`
  margin-bottom: 30px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 5px;
  }

  p {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background-color: ${(props) => props.color + "15"};
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ViewAllLink = styled(Link)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    text-decoration: underline;
  }
`;

const DevicesSection = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const DevicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const DeviceCard = styled(Link)`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.light};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const DeviceIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary + "15"};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const DeviceInfo = styled.div`
  flex: 1;
`;

const DeviceName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const DeviceDetails = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 2px;
`;

const DeviceLastSeen = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const DeviceStatus = styled.div`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(props) => (props.blocked ? "#DC3545" : "#28A745")}20;
  color: ${(props) => (props.blocked ? "#DC3545" : "#28A745")};
`;

const EventsSection = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
`;

const EventItem = styled.div`
  display: flex;
  padding: 12px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.light};
`;

const EventTypeIndicator = styled.div`
  width: 8px;
  border-radius: 4px;
  background-color: ${(props) => props.color};
  margin-right: 15px;
`;

const EventInfo = styled.div`
  flex: 1;
`;

const EventType = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const EventDescription = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 5px;
`;

const EventMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const EventDevice = styled.div``;

const EventTime = styled.div``;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;

  p {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 5px;
  }

  small {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.light};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.secondary};
`;

// Iconos
const DevicesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z" />
  </svg>
);

const BlockedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm7 10c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V6.3l7-3.11 7 3.11V11zm-11.59.59L6 13l4 4 8-8-1.41-1.42L10 14.17z" />
  </svg>
);

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const TimeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
  </svg>
);

export default Dashboard;
