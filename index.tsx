import { History } from "history";
import * as React from "react";
import { BehaviorSubject } from "rxjs";

type RouteConfig<P = any> = {
  key: string;
  label?: string;
  icon?: string;
  href?: string;

  hidden?: boolean;
  component?: () => Promise<{ default: React.ComponentType<P> }>;
};

type BaseRoute<P = any> = {
  key: string;
  level: number;
  icon?: string;
  label?: string;
  hidden?: boolean;
  href?: string;
  parent: IRoute | null;
  children: IRoute[] | null;
  component?: () => Promise<{ default: React.ComponentType<P> }>;
};

type SimpleRoute = BaseRoute & {
  params: null;
};

type ParamedRoute<P, K extends keyof P> = BaseRoute<P> & {
  params: K[];
};

export type IRoute = SimpleRoute | ParamedRoute<any, any>;

export function makeRoute(
  routeConfig: RouteConfig,
  parent?: IRoute
): SimpleRoute {
  const res: SimpleRoute = {
    parent: parent || null,
    children: null,
    level: parent ? parent.level + 1 : 0,
    params: null,
    ...routeConfig,
  };
  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push(res);
  }
  return res;
}

export function makeRouteWithParams<P, K extends keyof P>(
  routeConfig: RouteConfig<P>,
  params: K[],
  parent?: IRoute
): ParamedRoute<P, K> {
  let route = makeRoute(routeConfig, parent) as any;
  route.params = params;
  return route;
}

function traverseRoute(routes: IRoute[], visiter: (route: IRoute) => void) {
  for (let route of routes) {
    visiter(route);
    if (route.children) {
      traverseRoute(route.children, visiter);
    }
  }
}

export function makeRouter(history: History) {
  const componentMap = new Map<string, any>();

  const pathToRouteMap = new Map<string, IRoute>();

  let initialQuery: Record<string, string> = {};

  new URLSearchParams(history.location.search).forEach((v, k) => {
    initialQuery[k] = v;
  }, {});

  const buildRouteMap = (rootRoutes: IRoute[]) => {
    traverseRoute(rootRoutes, (route) => {
      pathToRouteMap.set(route.key, route);
      route.component &&
        componentMap.set(route.key, React.lazy(route.component));
      if (route.key === history.location.pathname) {
        route$.next({
          route: route,
          params: route$.value.params,
        });
      }
    });
  };

  const route$ = new BehaviorSubject({
    route: null as null | IRoute,
    params: initialQuery,
  });

  function searchParamsFromObject(params: any) {
    let urlParamsString = "";
    const urlParams = new URLSearchParams();
    if (params) {
      for (let key in params) {
        if (params[key] != undefined && params[key] !== "") {
          urlParams.set(key, params[key]);
        }
      }
      urlParamsString = "?" + String(urlParams);
    }
    return urlParamsString;
  }

  function createHref<P, K extends keyof P>(
    route: ParamedRoute<P, K>,
    query: { [k in K]: P[k] }
  ): string;
  function createHref(route: SimpleRoute): string;
  function createHref(route: IRoute, params?: any) {
    return route.key + searchParamsFromObject(params);
  }

  function pushHistory<P, K extends keyof P>(
    route: ParamedRoute<P, K>,
    query: { [k in K]: P[k] }
  ): void;
  function pushHistory(route: SimpleRoute): void;
  function pushHistory(route: IRoute, params?: any) {
    const newHref = createHref(route as any, params);
    history.push(newHref);
  }
  function pushParams(params?: any) {
    const urlParamsString = searchParamsFromObject(params);
    if (history.location.search !== urlParamsString)
      history.push(history.location.pathname + urlParamsString);
  }

  history.listen((location) => {
    let newQuery = {} as Record<string, string>;
    let searchParams = new URLSearchParams(location.search);
    searchParams.forEach((v, k) => {
      newQuery && (newQuery[k] = v);
    });
    let newRoute = route$.value.route;
    if (!newRoute || location.pathname !== newRoute.key) {
      newRoute = getRouteByKey(history.location.pathname);
    }
    if (newRoute !== route$.value.route || newQuery !== route$.value.params) {
      route$.next({
        route: newRoute,
        params: newQuery,
      });
    }
  });

  function WithParams({ Comp }: { Comp: React.ComponentType<any> }) {
    const [params, setParams] = React.useState(route$.value.params);
    React.useEffect(() => {
      const sub = route$.subscribe(({ params }) => setParams(params));
      return () => sub.unsubscribe();
    }, []);
    return <Comp {...params} />;
  }

  function useParams() {
    const [params, setParams] = React.useState(route$.value.params);
    React.useEffect(() => {
      const sub = route$.subscribe(({ params }) => setParams(params));
      return () => sub.unsubscribe();
    }, []);
    return params;
  }

  function getParams() {
    return route$.value.params;
  }

  function getRouteByKey(key: string) {
    return pathToRouteMap.get(key) || null;
  }

  type AnchorElementProps = React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >;

  function Link<P, K extends keyof P>(
    props: {
      route: ParamedRoute<P, K>;
      params: { [k in K]: P[k] };
    } & AnchorElementProps
  ): React.ReactElement;
  function Link(
    props: { route: SimpleRoute } & AnchorElementProps
  ): React.ReactElement;
  function Link(
    props: { route: IRoute; params?: any } & AnchorElementProps
  ): React.ReactElement;
  function Link({ route, params, ...rest }: any) {
    return (
      <a
        href={createHref(route, params)}
        onClick={(e) => {
          e.preventDefault();
          pushHistory(route, params);
        }}
        {...rest}
      />
    );
  }

  return {
    useParams,
    getParams,
    getRouteByKey,
    pushParams,
    pushHistory,
    route$,
    history,
    createHref,
    buildRouteMap,
    Link,
    Router: () => {
      const [{ CurComp, curRoute }, setState] = React.useState({
        CurComp: null as null | any,
        curRoute: route$.value.route,
      });
      React.useEffect(() => {
        const sub = route$.subscribe((v) => {
          if (v && v.route && v.route.component) {
            if (!componentMap.has(v.route.key)) {
              componentMap.set(v.route.key, React.lazy(v.route.component));
            }
            setState({
              curRoute: v.route,
              CurComp: componentMap.get(v.route.key),
            });
          } else {
            setState({
              curRoute: null,
              CurComp: null,
            });
          }
        });
        return () => sub.unsubscribe();
      }, []);
      if (CurComp && curRoute) {
        return (
          <React.Suspense fallback={null}>
            {curRoute.params ? <WithParams Comp={CurComp} /> : <CurComp />}
          </React.Suspense>
        );
      } else {
        return null;
      }
    },
  };
}
