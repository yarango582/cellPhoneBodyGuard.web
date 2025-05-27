import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <NavbarContainer>
      <LogoContainer>
        <LogoIcon>
          <ShieldIcon />
        </LogoIcon>
        <LogoText>SecureWipe</LogoText>
      </LogoContainer>

      <NavActions>
        <UserInfo>
          <UserAvatar>
            {user.email ? user.email.charAt(0).toUpperCase() : "U"}
          </UserAvatar>
          <UserEmail>{user.email}</UserEmail>
        </UserInfo>

        <LogoutButton onClick={handleLogout}>
          <LogoutIcon />
          <span>Cerrar sesión</span>
        </LogoutButton>
      </NavActions>
    </NavbarContainer>
  );
};

const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 64px;
  background-color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  margin-right: 10px;
  color: ${({ theme }) => theme.colors.primary};
`;

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
);

const LogoText = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 20px;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  margin-right: 10px;
`;

const UserEmail = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }

  span {
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      display: none;
    }
  }
`;

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: "5px" }}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default Navbar;
