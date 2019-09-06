import { History } from "history";
import { BehaviorSubject } from 'rxjs';
import * as React from "react";
declare type RouteConfig<P = any> = {
    key: string;
    label?: string;
    icon?: string;
    href?: string;
    hidden?: boolean;
    component?: () => Promise<{
        default: React.ComponentType<P>;
    }>;
};
declare type BaseRoute<P = any> = {
    key: string;
    level: number;
    icon?: string;
    label?: string;
    hidden?: boolean;
    href?: string;
    parent: IRoute | null;
    children: IRoute[] | null;
    component?: () => Promise<{
        default: React.ComponentType<P>;
    }>;
};
export declare type SimpleRoute = BaseRoute & {
    params: null;
};
export declare type ParamedRoute<P> = BaseRoute<P> & {
    params: (keyof P)[];
};
export declare type IRoute = SimpleRoute | ParamedRoute<any>;
export declare function makeRoute(routeConfig: RouteConfig, parent?: IRoute): SimpleRoute;
export declare function makeRouteWithParams<P>(routeConfig: RouteConfig<P>, params: (keyof P)[], parent?: IRoute): ParamedRoute<P>;
export declare function makeRouter(history: History): {
    useParams: () => Record<string, string>;
    getParams: () => Record<string, string>;
    getRouteByKey: (key: string) => SimpleRoute | ParamedRoute<any> | null;
    pushParams: (params?: any) => void;
    pushHistory: {
        <P>(route: ParamedRoute<P>, query: { [k in keyof P]: P[k]; }): void;
        (route: SimpleRoute): void;
    };
    route$: BehaviorSubject<{
        route: SimpleRoute | ParamedRoute<any> | null;
        params: Record<string, string>;
    }>;
    history: History<any>;
    createHref: {
        <P_1>(route: ParamedRoute<P_1>, query: { [p in keyof P_1]: string; }): string;
        (route: SimpleRoute): string;
    };
    init: (rootRoutes: IRoute[]) => void;
    Router: () => JSX.Element | null;
};
export {};
