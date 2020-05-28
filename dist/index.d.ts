import { History } from "history";
import * as React from "react";
import { BehaviorSubject } from "rxjs";
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
declare type SimpleRoute = BaseRoute & {
    params: null;
};
declare type ParamedRoute<P, K extends keyof P> = BaseRoute<P> & {
    params: K[];
};
export declare type IRoute = SimpleRoute | ParamedRoute<any, any>;
export declare function makeRoute(routeConfig: RouteConfig, parent?: IRoute): SimpleRoute;
export declare function makeRouteWithParams<P, K extends keyof P>(routeConfig: RouteConfig<P>, params: K[], parent?: IRoute): ParamedRoute<P, K>;
export declare function makeRouter(history: History): {
    useParams: () => Record<string, string>;
    getParams: () => Record<string, string>;
    getRouteByKey: (key: string) => SimpleRoute | ParamedRoute<any, any> | null;
    pushParams: (params?: any) => void;
    pushHistory: {
        <P, K extends keyof P>(route: ParamedRoute<P, K>, query: { [k in K]: P[k]; }): void;
        (route: SimpleRoute): void;
    };
    route$: BehaviorSubject<{
        route: SimpleRoute | ParamedRoute<any, any> | null;
        params: Record<string, string>;
    }>;
    history: History<any>;
    createHref: {
        <P_1, K_1 extends keyof P_1>(route: ParamedRoute<P_1, K_1>, query: { [k_1 in K_1]: P_1[k_1]; }): string;
        (route: SimpleRoute): string;
    };
    buildRouteMap: (rootRoutes: IRoute[]) => void;
    Link: {
        <P_2, K_2 extends keyof P_2>(props: {
            route: ParamedRoute<P_2, K_2>;
            params: { [k_2 in K_2]: P_2[k_2]; };
        } & React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>;
        (props: {
            route: SimpleRoute;
        } & React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>;
        (props: {
            route: IRoute;
            params?: any;
        } & React.ClassAttributes<HTMLAnchorElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>;
    };
    Router: () => JSX.Element | null;
};
export {};
