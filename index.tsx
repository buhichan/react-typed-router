import { History } from "history";
import { BehaviorSubject } from 'rxjs';
import * as React from "react"

type RouteConfig<P = any> = {
    key: string,
    label?: string,
    icon?: string,
    href?: string,

    hidden?: boolean,
    component?: () => Promise<{ default: React.ComponentType<P> }>,
}

type BaseRoute<P = any> = {
    key: string,
    level: number,
    icon?: string,
    label?: string,
    hidden?: boolean,
    href?: string,
    parent: IRoute | null,
    children: IRoute[] | null,
    component?: () => Promise<{ default: React.ComponentType<P> }>
}

export type SimpleRoute = BaseRoute & {
    params: null
}

export type ParamedRoute<P> = BaseRoute<P> & {
    params: (keyof P)[],
}

export type IRoute = SimpleRoute | ParamedRoute<any>

export function makeRoute(routeConfig: RouteConfig, parent?: IRoute): SimpleRoute {
    const res: SimpleRoute = {
        parent: parent || null,
        children: null,
        level: parent ? parent.level + 1 : 0,
        params: null,
        ...routeConfig,
    }
    if (parent) {
        if (!parent.children)
            parent.children = []
        parent.children.push(res)
    }
    return res
}

export function makeRouteWithParams<P>(routeConfig: RouteConfig<P>, params: (keyof P)[], parent?: IRoute): ParamedRoute<P> {
    let route = makeRoute(routeConfig, parent) as any
    route.params = params
    return route
}

function traverseRoute(routes: IRoute[], visiter: (route: IRoute) => void) {
    for (let route of routes) {
        visiter(route)
        if (route.children) {
            traverseRoute(route.children, visiter)
        }
    }
}

export function makeRouter(history:History) {

    // const history = createBrowserHistory()

    const componentMap = new Map<string, any>()

    const pathToRouteMap = new Map<string, IRoute>()

    let initialQuery: Record<string, string> = {}

    new URLSearchParams(history.location.search).forEach((v, k) => {
        initialQuery[k] = v
    }, {})

    const init = (rootRoutes: IRoute[])=>{
        traverseRoute(rootRoutes, (route) => {
            pathToRouteMap.set(route.key, route)
            route.component && componentMap.set(route.key, React.lazy(route.component))
            if(route.key === history.location.pathname){
                route$.next({
                    route:route,
                    params:route$.value.params,
                })
            }
        })
    }

    const route$ = new BehaviorSubject({
        route: null as null | IRoute,
        params: initialQuery,
    })

    function searchParamsFromObject(params:any){
        let urlParamsString = ""
        const urlParams = new URLSearchParams()
        if(params){
            for(let key in params){
                if(params[key] != undefined && params[key] !== ""){
                    urlParams.set(key, params[key])
                }
            }
            urlParamsString = "?" + String(urlParams)
        }
        return urlParamsString
    }

    function createHref<P>(route: ParamedRoute<P>, query: { [p in keyof P]: string }): string
    function createHref(route: SimpleRoute): string
    function createHref(route: IRoute, params?: any) {
        return route.key + searchParamsFromObject(params)
    }

    function pushHistory<P>(route: ParamedRoute<P>, query: { [k in keyof P]: P[k] }): void
    function pushHistory(route: SimpleRoute): void
    function pushHistory(route: IRoute, params?: any) {
        const newHref = createHref(route as any,params)
        history.push(newHref)
    }
    function pushParams(params?: any) {
        const urlParamsString = searchParamsFromObject(params)
        if(history.location.search !== urlParamsString)
            history.push(history.location.pathname + urlParamsString)
    }

    history.listen((location) => {
        let newQuery = {} as Record<string, string>
        let searchParams = new URLSearchParams(location.search)
        searchParams.forEach((v, k) => {
            newQuery && (newQuery[k] = v)
        })
        let newRoute = route$.value.route
        if (!newRoute || location.pathname !== newRoute.key) {
            newRoute = getRouteByKey(history.location.pathname)
        }
        if (newRoute !== route$.value.route || newQuery !== route$.value.params) {
            route$.next({
                route: newRoute,
                params: newQuery
            })
        }
    })

    function WithParams({ Comp, usedParams }: { Comp: React.ComponentType<any>, usedParams:any[] }) {
        const [params, setParams] = React.useState(route$.value.params)
        React.useEffect(() => {
            const sub = route$.subscribe(({ params }) => setParams(usedParams.reduce((map,k)=>{
                map[k] = params[k]
                return map
            },{})))
            return () => sub.unsubscribe()
        }, [usedParams])
        return <Comp {...params} />
    }

    function useParams() {
        const [params, setParams] = React.useState(route$.value.params)
        React.useEffect(() => {
            const sub = route$.subscribe(({ params }) => setParams(params))
            return () => sub.unsubscribe()
        }, [])
        return params
    }

    function getParams() {
        return route$.value.params
    }

    function getRouteByKey(key: string) {
        return pathToRouteMap.get(key) || null
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
        init,
        Router: () => {
            const [{CurComp,curRoute},setState] = React.useState({
                CurComp: null as null | any,
                curRoute: route$.value.route
            })
            React.useEffect(() => {
                const sub = route$.subscribe(v => {
                    if (v && v.route && v.route.component) {
                        if (!componentMap.has(v.route.key)) {
                            componentMap.set(v.route.key, React.lazy(v.route.component))
                        }
                        setState({
                            curRoute:v.route,
                            CurComp:componentMap.get(v.route.key)
                        })
                    } else {
                        setState({
                            curRoute:null,
                            CurComp:null
                        })
                    }
                })
                return () => sub.unsubscribe()
            }, [])
            if (CurComp && curRoute) {
                return <React.Suspense fallback={null}>
                    {curRoute.params ? <WithParams Comp={CurComp} usedParams={curRoute.params} /> : <CurComp />}
                </React.Suspense>
            } else {
                return null
            }
        }
    }
}