import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <SidebarContainer>
      <NavMenu>
        <NavItem>
          <StyledNavLink to="/" end>
            <DashboardIcon />
            <span>Dashboard</span>
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to="/devices">
            <DevicesIcon />
            <span>Dispositivos</span>
          </StyledNavLink>
        </NavItem>
        <NavItem>
          <StyledNavLink to="/settings">
            <SettingsIcon />
            <span>Configuración</span>
          </StyledNavLink>
        </NavItem>
      </NavMenu>

      <SidebarFooter>
        <SupportButton>
          <SupportIcon />
          <span>Soporte</span>
        </SupportButton>
      </SidebarFooter>
    </SidebarContainer>
  );
};

const SidebarContainer = styled.aside`
  width: 250px;
  background-color: ${({ theme }) => theme.colors.white};
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 60px;
  }
`;

const NavMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 20px 0;
`;

const NavItem = styled.li`
  margin-bottom: 5px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.light};
  }

  &.active {
    background-color: ${({ theme }) => theme.colors.primary + "15"};
    color: ${({ theme }) => theme.colors.primary};
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
  }

  svg {
    margin-right: 15px;
    width: 20px;
    height: 20px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 12px;
    justify-content: center;

    span {
      display: none;
    }

    svg {
      margin-right: 0;
    }
  }
`;

const SidebarFooter = styled.div`
  padding: 20px;
  border-top: 1px solid #e0e0e0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 10px;
  }
`;

const SupportButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px;
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.info};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.info};
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.info};
    color: ${({ theme }) => theme.colors.white};
  }

  svg {
    margin-right: 10px;
    width: 18px;
    height: 18px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    justify-content: center;

    span {
      display: none;
    }

    svg {
      margin-right: 0;
    }
  }
`;

// Iconos
const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

const DevicesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

const SupportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-3.5h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z" />
  </svg>
);

export default Sidebar;
