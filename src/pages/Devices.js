import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'blocked'

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchDevices = async () => {
      if (!auth.currentUser) return;

      try {
        // Obtener dispositivos del usuario
        const userDevicesQuery = query(
          collection(db, "devices"),
          where("userId", "==", auth.currentUser.uid),
          orderBy("lastActivity", "desc")
        );

        const devicesSnapshot = await getDocs(userDevicesQuery);
        const devicesList = [];

        // Procesar dispositivos
        devicesSnapshot.forEach((doc) => {
          devicesList.push({ id: doc.id, ...doc.data() });
        });

        setDevices(devicesList);
      } catch (error) {
        console.error("Error al cargar dispositivos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [auth.currentUser, db]);

  // Filtrar dispositivos según búsqueda y filtro
  const filteredDevices = devices.filter((device) => {
    // Filtrar por término de búsqueda
    const searchMatch =
      (device.deviceName &&
        device.deviceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.brand &&
        device.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.modelName &&
        device.modelName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtrar por estado
    let statusMatch = true;
    if (filter === "active") {
      statusMatch = !device.deviceBlocked;
    } else if (filter === "blocked") {
      statusMatch = device.deviceBlocked;
    }

    return searchMatch && statusMatch;
  });

  // Función para formatear la fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Cargando dispositivos...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <DevicesContainer>
      <PageHeader>
        <h1>Mis Dispositivos</h1>
        <p>Gestiona y monitorea tus dispositivos protegidos</p>
      </PageHeader>

      <ControlsBar>
        <SearchBox>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Buscar dispositivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm("")}>
              <ClearIcon />
            </ClearButton>
          )}
        </SearchBox>

        <FilterButtons>
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Todos
          </FilterButton>
          <FilterButton
            active={filter === "active"}
            onClick={() => setFilter("active")}
          >
            Activos
          </FilterButton>
          <FilterButton
            active={filter === "blocked"}
            onClick={() => setFilter("blocked")}
          >
            Bloqueados
          </FilterButton>
        </FilterButtons>
      </ControlsBar>

      {devices.length === 0 ? (
        <EmptyState>
          <EmptyIcon />
          <h3>No tienes dispositivos registrados</h3>
          <p>Descarga la aplicación móvil para registrar un dispositivo</p>
        </EmptyState>
      ) : filteredDevices.length === 0 ? (
        <EmptyState>
          <SearchEmptyIcon />
          <h3>No se encontraron resultados</h3>
          <p>Intenta con otros términos de búsqueda o filtros</p>
        </EmptyState>
      ) : (
        <DevicesGrid>
          {filteredDevices.map((device) => (
            <DeviceCard key={device.id} to={`/devices/${device.id}`}>
              <DeviceHeader>
                <DeviceIcon>
                  <PhoneIcon />
                </DeviceIcon>
                <DeviceStatus blocked={device.deviceBlocked}>
                  {device.deviceBlocked ? "Bloqueado" : "Activo"}
                </DeviceStatus>
              </DeviceHeader>

              <DeviceName>
                {device.deviceName || "Dispositivo sin nombre"}
              </DeviceName>
              <DeviceModel>
                {device.brand} {device.modelName}
              </DeviceModel>

              <DeviceInfo>
                <DeviceInfoItem>
                  <InfoLabel>Sistema:</InfoLabel>
                  <InfoValue>
                    {device.osName} {device.osVersion}
                  </InfoValue>
                </DeviceInfoItem>
                <DeviceInfoItem>
                  <InfoLabel>Última actividad:</InfoLabel>
                  <InfoValue>{formatDate(device.lastActivity)}</InfoValue>
                </DeviceInfoItem>
                {device.deviceBlocked && device.blockedAt && (
                  <DeviceInfoItem>
                    <InfoLabel>Bloqueado el:</InfoLabel>
                    <InfoValue>{formatDate(device.blockedAt)}</InfoValue>
                  </DeviceInfoItem>
                )}
              </DeviceInfo>

              <ViewDetailsButton>
                Ver detalles
                <ArrowIcon />
              </ViewDetailsButton>
            </DeviceCard>
          ))}
        </DevicesGrid>
      )}
    </DevicesContainer>
  );
};

// Estilos
const DevicesContainer = styled.div`
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

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
`;

const SearchBox = styled.div`
  position: relative;
  width: 300px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 100%;
  }
`;

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{
      position: "absolute",
      left: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "20px",
      height: "20px",
      color: "#6c757d",
    }}
  >
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const ClearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="18"
    height="18"
  >
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const FilterButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const FilterButton = styled.button`
  padding: 8px 15px;
  border: 1px solid
    ${(props) => (props.active ? props.theme.colors.primary : "#ddd")};
  border-radius: 4px;
  background-color: ${(props) =>
    props.active ? props.theme.colors.primary + "15" : "white"};
  color: ${(props) =>
    props.active ? props.theme.colors.primary : props.theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary + "10"};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 8px;
  padding: 50px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    margin: 15px 0 5px;
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.secondary};
  }

  svg {
    width: 60px;
    height: 60px;
    color: ${({ theme }) => theme.colors.secondary};
    opacity: 0.5;
  }
`;

const EmptyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
    <path d="M9.5 8.5h5v2h-5zM8 12h8v2H8zM9 15.5h6v2H9z" opacity=".3" />
  </svg>
);

const SearchEmptyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" opacity=".3" />
  </svg>
);

const DevicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const DeviceCard = styled(Link)`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  text-decoration: none;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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

  svg {
    width: 24px;
    height: 24px;
  }
`;

const DeviceStatus = styled.div`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${(props) => (props.blocked ? "#DC3545" : "#28A745")}20;
  color: ${(props) => (props.blocked ? "#DC3545" : "#28A745")};
`;

const DeviceName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DeviceModel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 15px;
`;

const DeviceInfo = styled.div`
  margin-bottom: 20px;
  flex: 1;
`;

const DeviceInfoItem = styled.div`
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
`;

const InfoLabel = styled.div`
  width: 110px;
  color: ${({ theme }) => theme.colors.secondary};
`;

const InfoValue = styled.div`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const ViewDetailsButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary + "15"};
  }

  svg {
    margin-left: 5px;
    width: 16px;
    height: 16px;
  }
`;

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
  </svg>
);

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

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
  </svg>
);

export default Devices;
