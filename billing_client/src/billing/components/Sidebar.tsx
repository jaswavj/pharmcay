import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MenuItem from './MenuItem';
import { useSidebar } from '../../context/SidebarContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { billingMenuConfig, filterMenuByModules, moduleIdForPath, MENU_MODULE } from '../config/menu.config';
import '../../style/sidebar.css';
import ModuleSidebarShell from '../../components/ModuleSidebarShell';
import { toggleExpandedMenus } from '../../components/sidebarExpanded';

const Sidebar: React.FC = () => {
  const { mobileOpen, closeMobileSidebar, collapsed } = useSidebar();
  const location = useLocation();
  const moduleIds = useSelector((s: RootState) => s.loginData.moduleIds || []);
  const menus = filterMenuByModules(billingMenuConfig, moduleIds);
  const [expandedMenuId, setExpandedMenuIds] = useState<string[]>([]);
  const setExpandedMenuId = (id: string | null) => {
    if (!id) return;
    setExpandedMenuIds((prev) => toggleExpandedMenus(prev, id));
  };

  useEffect(() => {
    const moduleId = moduleIdForPath(location.pathname);
    const openId =
      moduleId === MENU_MODULE.master ? 'master'
        : moduleId === MENU_MODULE.purchase ? 'purchase'
          : moduleId === MENU_MODULE.stockReport ? 'stock-report'
          : moduleId === MENU_MODULE.users ? 'users'
            : moduleId === MENU_MODULE.admin ? 'admin'
              : null;
    if (openId) setExpandedMenuIds([openId]);
  }, [location.pathname]);

  return (
    <ModuleSidebarShell
      title="Pharmacy"
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      onCloseMobile={closeMobileSidebar}
    >
      <ul className="sidebar-menu">
        {menus.map((menu) => (
          <MenuItem
            key={menu.id}
            item={menu}
            collapsed={collapsed}
            onNavigate={closeMobileSidebar}
            expandedMenuId={expandedMenuId}
            setExpandedMenuId={setExpandedMenuId}
          />
        ))}
      </ul>
    </ModuleSidebarShell>
  );
};

export default Sidebar;
