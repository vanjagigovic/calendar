import { useState } from "react";
import {
  Avatar,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import {
  accountAvatarSx,
  accountIdentityItemSx,
  accountMenuButtonSx,
  accountMenuSx,
} from "../styles/accountStyles";

export function UserAccountMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  const handleOpenProfile = () => {
    handleClose();
    navigate("/profile");
  };

  const handleLogout = async () => {
    handleClose();
    setLoggingOut(true);

    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <IconButton
        aria-label={user?.email ?? t("account")}
        aria-controls={anchorElement ? "user-account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={anchorElement ? "true" : undefined}
        onClick={handleOpen}
        disabled={loggingOut}
        sx={accountMenuButtonSx}
      >
        <Avatar sx={accountAvatarSx}>
          {loggingOut ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <AccountCircleOutlinedIcon />
          )}
        </Avatar>
      </IconButton>

      <Menu
        id="user-account-menu"
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={handleClose}
        sx={accountMenuSx}
      >
        <MenuItem disabled sx={accountIdentityItemSx}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{user?.email ?? t("account")}</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleOpenProfile}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("myProfile")}</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => void handleLogout()} disabled={loggingOut}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("logout")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
