import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import RemoteControl from "../components/RemoteControl";

const DeviceDetail = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("control");

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!auth.currentUser || !deviceId) return;

      try {
        // Verificar que el ID del dispositivo corresponde al formato esperado
        if (
          !deviceId.startsWith("device-") ||
          deviceId.substring(7) !== auth.currentUser.uid
        ) {
          navigate("/devices");
          return;
        }

        // Obtener datos del usuario
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (!userDoc.exists()) {
          navigate("/devices");
          return;
        }

        const userData = userDoc.data();

        // Crear objeto de dispositivo con la información del usuario
        const deviceData = {
          id: deviceId,
          deviceName: userData.deviceInfo?.name || "Mi dispositivo",
          brand: userData.deviceInfo?.brand || "Desconocido",
          modelName: userData.deviceInfo?.modelName || "Desconocido",
          osName: userData.deviceInfo?.osName || "Android",
          osVersion: userData.deviceInfo?.osVersion || "Desconocido",
          deviceBlocked: userData.deviceBlocked || false,
          lastActivity: userData.lastActivity || new Date().toISOString(),
          blockedAt: userData.blockedAt,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          createdAt: userData.createdAt,
          securitySettings: userData.securitySettings || {},
        };

        setDevice(deviceData);

        // Obtener eventos de seguridad recientes
        const eventsQuery = query(
          collection(db, "securityEvents"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc"),
          limit(20)
        );

        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = [];

        eventsSnapshot.forEach((doc) => {
          eventsList.push({ id: doc.id, ...doc.data() });
        });

        setEvents(eventsList);
      } catch (error) {
        console.error("Error al cargar datos del dispositivo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
  }, [auth.currentUser, deviceId, db, navigate]);

  // Función para formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleString();
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

  // Función para enviar comandos remotos
  const sendRemoteCommand = async (command) => {
    if (!device || actionLoading) return;

    try {
      setActionLoading(true);

      // Si el comando es bloquear, actualizar el estado del usuario
      if (command === "lock") {
        // Actualizar el documento del usuario
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          deviceBlocked: true,
          blockedAt: new Date().toISOString(),
          blockReason: "remote_lock",
          lastActivity: new Date().toISOString(),
        });

        // Registrar el evento de bloqueo
        await addDoc(collection(db, "securityEvents"), {
          type: "device_blocked",
          description: "Dispositivo bloqueado remotamente desde la web",
          timestamp: Date.now(),
          userId: auth.currentUser.uid,
          details: { reason: "remote_lock" },
        });

        // Actualizar el estado local
        setDevice({
          ...device,
          deviceBlocked: true,
          blockedAt: new Date().toISOString(),
          blockReason: "remote_lock",
        });

        alert(
          "Dispositivo bloqueado exitosamente. El usuario necesitará su clave de seguridad para desbloquearlo."
        );
      }

      // Si el comando es desbloquear, actualizar el estado del usuario
      if (command === "unlock") {
        // Actualizar el documento del usuario
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          deviceBlocked: false,
          unblockedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        });

        // Registrar el evento de desbloqueo
        await addDoc(collection(db, "securityEvents"), {
          type: "device_unblocked",
          description: "Dispositivo desbloqueado remotamente desde la web",
          timestamp: Date.now(),
          userId: auth.currentUser.uid,
        });

        // Actualizar el estado local
        setDevice({
          ...device,
          deviceBlocked: false,
          unblockedAt: new Date().toISOString(),
        });

        alert("Dispositivo desbloqueado exitosamente.");
      }
    } catch (error) {
      console.error("Error al enviar comando remoto:", error);
      alert("Error al enviar comando remoto");
    } finally {
      setActionLoading(false);
    }
  };

  // Función para confirmar acción
  const confirmAction = (action, command) => {
    let message = "";

    switch (command) {
      case "lock":
        message =
          "¿Estás seguro de que deseas bloquear este dispositivo? El usuario necesitará su clave de seguridad para desbloquearlo.";
        break;
      case "unlock":
        message =
          "¿Estás seguro de que deseas desbloquear este dispositivo remotamente?";
        break;
      case "backup":
        message =
          "¿Estás seguro de que deseas iniciar una copia de seguridad remota? Esto puede consumir datos móviles del dispositivo.";
        break;
      case "locate":
        message = "¿Estás seguro de que deseas localizar este dispositivo?";
        break;
      default:
        message = `¿Estás seguro de que deseas enviar el comando "${command}"?`;
    }

    if (window.confirm(message)) {
      sendRemoteCommand(command);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Cargando información del dispositivo...</LoadingText>
      </LoadingContainer>
    );
  }

  if (!device) {
    return (
      <ErrorContainer>
        <ErrorIcon />
        <ErrorTitle>Dispositivo no encontrado</ErrorTitle>
        <ErrorMessage>
          El dispositivo que buscas no existe o no tienes acceso a él.
        </ErrorMessage>
        <BackButton onClick={() => navigate("/devices")}>
          Volver a dispositivos
        </BackButton>
      </ErrorContainer>
    );
  }

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={() => navigate("/devices")}>
          <BackIcon />
          Volver a dispositivos
        </BackButton>
      </Header>

      <DeviceHeader>
        <DeviceIconLarge>
          <PhoneIcon />
        </DeviceIconLarge>

        <DeviceHeaderInfo>
          <DeviceName>
            {device.deviceName || "Dispositivo sin nombre"}
          </DeviceName>
          <DeviceModel>
            {device.brand} {device.modelName}
          </DeviceModel>
          <DeviceLastSeen>
            Última actividad: {formatDate(device.lastActivity)}
          </DeviceLastSeen>
          <DeviceStatus blocked={device.deviceBlocked}>
            {device.deviceBlocked ? "Bloqueado" : "Activo"}
          </DeviceStatus>
        </DeviceHeaderInfo>
      </DeviceHeader>

      <ActionButtons>
        {device.deviceBlocked ? (
          <ActionButton
            color="#28A745"
            onClick={() => confirmAction("Desbloquear", "unlock")}
            disabled={actionLoading}
          >
            <UnlockIcon />
            Desbloquear
          </ActionButton>
        ) : (
          <ActionButton
            color="#DC3545"
            onClick={() => confirmAction("¿Bloquear dispositivo?", "lock")}
            disabled={device.deviceBlocked || actionLoading}
          >
            <LockIcon />
            Bloquear
          </ActionButton>
        )}

        <ActionButton
          color="#17A2B8"
          onClick={() => alert("Esta función estará disponible próximamente")}
          disabled={true}
        >
          <BackupIcon />
          Próximamente
        </ActionButton>

        <ActionButton
          color="#FFC107"
          onClick={() => alert("Esta función estará disponible próximamente")}
          disabled={true}
        >
          <LocationIcon />
          Próximamente
        </ActionButton>
      </ActionButtons>

      <TabsContainer>
        <TabButton
          active={activeTab === "control"}
          onClick={() => setActiveTab("control")}
        >
          Control Remoto
        </TabButton>
        <TabButton
          active={activeTab === "info"}
          onClick={() => setActiveTab("info")}
        >
          Información
        </TabButton>
        <TabButton
          active={activeTab === "events"}
          onClick={() => setActiveTab("events")}
        >
          Eventos
        </TabButton>
      </TabsContainer>

      {activeTab === "control" ? (
        <RemoteControl deviceId={deviceId} />
      ) : activeTab === "info" ? (
        <InfoPanel>
          <InfoSection>
            <SectionTitle>Información del dispositivo</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Marca</InfoLabel>
                <InfoValue>{device.brand || "N/A"}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Modelo</InfoLabel>
                <InfoValue>{device.modelName || "N/A"}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Sistema operativo</InfoLabel>
                <InfoValue>
                  {device.osName} {device.osVersion}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Registrado el</InfoLabel>
                <InfoValue>{formatDate(device.createdAt)}</InfoValue>
              </InfoItem>
              {device.deviceBlocked && (
                <>
                  <InfoItem>
                    <InfoLabel>Bloqueado el</InfoLabel>
                    <InfoValue>{formatDate(device.blockedAt)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Razón del bloqueo</InfoLabel>
                    <InfoValue>{device.blockReason || "N/A"}</InfoValue>
                  </InfoItem>
                </>
              )}
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>Configuración de seguridad</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Protección activa</InfoLabel>
                <InfoValue>
                  {device.securitySettings?.enabled
                    ? "Activada"
                    : "Desactivada"}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Bloqueo automático</InfoLabel>
                <InfoValue>
                  {device.securitySettings?.autoBlockEnabled
                    ? "Activado"
                    : "Desactivado"}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Umbral de alertas</InfoLabel>
                <InfoValue>
                  {device.securitySettings?.suspiciousAttemptsThreshold ||
                    "N/A"}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Cifrado remoto</InfoLabel>
                <InfoValue>
                  {device.securitySettings?.remoteWipeEnabled
                    ? "Activado"
                    : "Desactivado"}
                </InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>
        </InfoPanel>
      ) : (
        <EventsPanel>
          {events.length === 0 ? (
            <EmptyState>
              <p>No hay eventos de seguridad registrados</p>
              <small>Los eventos aparecerán aquí cuando ocurran</small>
            </EmptyState>
          ) : (
            <EventsList>
              {events.map((event) => (
                <EventItem key={event.id}>
                  <EventTime>{formatDate(event.timestamp)}</EventTime>
                  <EventContent>
                    <EventType>{getEventTypeName(event.type)}</EventType>
                    <EventDescription>{event.description}</EventDescription>
                    {event.details && (
                      <EventDetails>
                        {Object.entries(event.details).map(([key, value]) => (
                          <EventDetailItem key={key}>
                            <EventDetailLabel>{key}:</EventDetailLabel>
                            <EventDetailValue>
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : value.toString()}
                            </EventDetailValue>
                          </EventDetailItem>
                        ))}
                      </EventDetails>
                    )}
                  </EventContent>
                </EventItem>
              ))}
            </EventsList>
          )}
        </EventsPanel>
      )}
    </DetailContainer>
  );
};

// Estilos
const DetailContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 14px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  svg {
    margin-right: 5px;
  }
`;

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);

const DeviceStatus = styled.div`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(props) => (props.blocked ? "#DC3545" : "#28A745")}20;
  color: ${(props) => (props.blocked ? "#DC3545" : "#28A745")};
  margin-top: 10px;
  display: inline-block;
`;

const DeviceHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const DeviceIconLarge = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.primary + "15"};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;

  svg {
    width: 48px;
    height: 48px;
  }
`;

const DeviceHeaderInfo = styled.div`
  flex: 1;
`;

const DeviceName = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 5px;
`;

const DeviceModel = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 5px;
`;

const DeviceLastSeen = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: ${(props) => props.color}20;
  color: ${(props) => props.color};
  border: 1px solid ${(props) => props.color};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => props.color}30;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    margin-right: 8px;
    width: 20px;
    height: 20px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.active ? props.theme.colors.primary : "transparent")};
  color: ${(props) =>
    props.active ? props.theme.colors.primary : props.theme.colors.text};
  font-size: 14px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const InfoPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const InfoSection = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 20px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const EventsPanel = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const EventItem = styled.div`
  display: flex;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;

  &:last-child {
    border-bottom: none;
  }
`;

const EventTime = styled.div`
  width: 180px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  padding-right: 15px;
`;

const EventContent = styled.div`
  flex: 1;
`;

const EventType = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 5px;
`;

const EventDescription = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 10px;
`;

const EventDetails = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
`;

const EventDetailItem = styled.div`
  display: flex;
  margin-bottom: 5px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const EventDetailLabel = styled.div`
  width: 100px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const EventDetailValue = styled.div`
  flex: 1;
  color: ${({ theme }) => theme.colors.secondary};
  word-break: break-word;
`;

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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  padding: 0 20px;
`;

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="60"
    height="60"
    viewBox="0 0 24 24"
    fill="#DC3545"
    style={{ marginBottom: "20px" }}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 10px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 20px;
`;

// Iconos
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
);

const UnlockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z" />
  </svg>
);

const BackupIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
  </svg>
);

const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

export default DeviceDetail;
