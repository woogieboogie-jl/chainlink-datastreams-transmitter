import { NavLink, Outlet } from '@remix-run/react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu';
import { cn } from '~/lib/utils';

export default function Verifiers() {
  return (
    <div className="space-y-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavLink
              to="evm"
              className={cn(
                navigationMenuTriggerStyle(),
                'aria-[current=page]:text-primary'
              )}
            >
              EVM
            </NavLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavLink
              to="svm"
              className={cn(
                navigationMenuTriggerStyle(),
                'aria-[current=page]:text-primary'
              )}
            >
              SVM
            </NavLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <Outlet />
    </div>
  );
}
