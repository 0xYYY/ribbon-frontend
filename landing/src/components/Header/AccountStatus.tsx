import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useWeb3React } from "@web3-react/core";
import { setTimeout } from "timers";

import sizes from "../../designSystem/sizes";
import { Title, BaseButton } from "../../designSystem";
import { addConnectEvent } from "../../utils/analytics";
import colors from "../../designSystem/colors";
import {
  WalletStatusProps,
  AccountStatusVariantProps,
  WalletButtonProps,
  MenuStateProps,
  WalletCopyIconProps,
} from "./types";
import theme from "../../designSystem/theme";
import MobileOverlayMenu from "../Common/MobileOverlayMenu";
import MenuButton from "../Header/MenuButton";
import useOutsideAlerter from "../../hooks/useOutsideAlerter";
import ButtonArrow from "../Common/ButtonArrow";

const walletButtonMarginLeft = 5;
const walletButtonWidth = 55;
const investButtonWidth = 30;
const investButtonMarginLeft =
  100 - walletButtonMarginLeft * 2 - walletButtonWidth - investButtonWidth;

const WalletContainer = styled.div<AccountStatusVariantProps>`
  justify-content: center;
  align-items: center;

  ${(props) => {
    switch (props.variant) {
      case "desktop":
        return `
          display: flex;
          padding-right: 40px;
          z-index: 1000;
          position: relative;
  
          @media (max-width: ${sizes.md}px) {
            display: none;
          }
          `;
      case "mobile":
        return `
            display: none;
  
            @media (max-width: ${sizes.md}px) {
              display: flex;
              align-items: unset;
              padding-top: 16px;
              width: 100%;
            }
          `;
    }
  }}
`;

const WalletButton = styled(BaseButton)<WalletButtonProps>`
  background-color: ${colors.backgroundDarker};
  align-items: center;
  height: fit-content;

  &:hover {
    opacity: ${theme.hover.opacity};
  }

  ${(props) => {
    switch (props.variant) {
      case "mobile":
        return `
          height: 48px;
          justify-content: center;
          padding: 14px 16px;
          width: ${props.showInvestButton ? `${walletButtonWidth}%` : "90%"};
        `;
      case "desktop":
        return ``;
    }
  }}
`;

const WalletButtonText = styled(Title)<WalletStatusProps>`
  font-size: 14px;
  line-height: 20px;

  @media (max-width: ${sizes.md}px) {
    font-size: 16px;
  }

  @media (max-width: 350px) {
    font-size: 13px;
  }
`;

const WalletDesktopMenu = styled.div<MenuStateProps>`
  ${(props) =>
    props.isMenuOpen
      ? `
            position: absolute;
            right: 40px;
            top: 64px;
            width: fit-content;
            background-color: ${colors.backgroundDarker};
            border-radius: ${theme.border.radius};
          `
      : `
            display: none;
          `}

  @media (max-width: ${sizes.md}px) {
    display: none;
  }
`;

const WalletMobileOverlayMenu = styled(
  MobileOverlayMenu
)<AccountStatusVariantProps>`
  display: none;

  ${(props) => {
    switch (props.variant) {
      case "mobile":
        return `
            @media (max-width: ${sizes.md}px) {
              display: flex;
              z-index: ${props.isMenuOpen ? 50 : -1};
            }
          `;
      case "desktop":
        return ``;
    }
  }}
`;

const MenuItem = styled.div`
  padding: 8px 16px;
  padding-right: 38px;
  opacity: 1;
  display: flex;
  align-items: center;

  &:first-child {
    padding-top: 16px;
  }

  &:last-child {
    padding-bottom: 16px;
  }

  &:hover {
    span {
      color: ${colors.primaryText};
    }
  }

  @media (max-width: ${sizes.md}px) {
    margin: unset;
    && {
      padding: 28px;
    }
  }
`;

const MenuItemText = styled(Title)`
  color: ${colors.primaryText}A3;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;

  @media (max-width: ${sizes.md}px) {
    font-size: 24px;
  }
`;

const WalletCopyIcon = styled.i<WalletCopyIconProps>`
  color: white;
  margin-left: 8px;
  transition: 0.1s all ease-out;

  ${(props) => {
    switch (props.state) {
      case "visible":
        return `
            opacity: 1;
          `;
      case "hiding":
        return `
            opacity: 0;
          `;
      case "hidden":
        return `
            visibility: hidden;
            height: 0;
            width: 0;
            opacity: 0;
          `;
    }
  }}
`;

const MenuCloseItem = styled(MenuItem)`
  position: absolute;
  bottom: 50px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
`;

interface AccountStatusProps {
  variant: "desktop" | "mobile";
  showInvestButton?: boolean;
}

const truncateAddress = (address: string) => {
  return address.slice(0, 6) + "..." + address.slice(address.length - 4);
};

const AccountStatus: React.FC<AccountStatusProps> = ({
  variant,
  showInvestButton,
}) => {
  const {
    connector,
    deactivate: deactivateWeb3,
    library,
    active,
    account,
  } = useWeb3React();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyState, setCopyState] = useState<"visible" | "hiding" | "hidden">(
    "hidden"
  );

  // Track clicked area outside of desktop menu
  const desktopMenuRef = useRef(null);
  useOutsideAlerter(desktopMenuRef, () => {
    if (variant === "desktop" && isMenuOpen) onCloseMenu();
  });

  useEffect(() => {
    let timer;

    switch (copyState) {
      case "visible":
        timer = setTimeout(() => {
          setCopyState("hiding");
        }, 800);
        break;
      case "hiding":
        timer = setTimeout(() => {
          setCopyState("hidden");
        }, 200);
    }

    if (timer) clearTimeout(timer);
  }, [copyState]);

  const onToggleMenu = useCallback(() => {
    setIsMenuOpen((open) => !open);
  }, []);

  const onCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const renderButtonContent = () => (
    <>
      <WalletButtonText>
        test <ButtonArrow isOpen={isMenuOpen} />
      </WalletButtonText>
    </>
  );

  const renderMenuItem = (
    title: string,
    onClick?: () => void,
    extra?: React.ReactNode
  ) => {
    return (
      <MenuItem onClick={onClick} role="button">
        <MenuItemText>{title}</MenuItemText>
        {extra}
      </MenuItem>
    );
  };

  return (
    <>
      {/* Main Button and Desktop Menu */}
      <WalletContainer variant={variant} ref={desktopMenuRef}>
        <WalletButton variant={variant} role="button" onClick={onToggleMenu}>
          {renderButtonContent()}
        </WalletButton>
        <WalletDesktopMenu isMenuOpen={isMenuOpen}>
          {renderMenuItem("CHANGE WALLET", () => {})}
        </WalletDesktopMenu>
      </WalletContainer>

      {/* Mobile Menu */}
      <WalletMobileOverlayMenu
        className="flex-column align-items-center justify-content-center"
        isMenuOpen={isMenuOpen}
        onClick={onCloseMenu}
        variant={variant}
        mountRoot="div#root"
        overflowOnOpen={false}
      >
        {renderMenuItem("CHANGE WALLET", () => {})}

        <MenuCloseItem role="button" onClick={onCloseMenu}>
          <MenuButton isOpen={true} onToggle={onCloseMenu} />
        </MenuCloseItem>
      </WalletMobileOverlayMenu>
    </>
  );
};
export default AccountStatus;