"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var React = require("react");
function makeRoute(routeConfig, parent) {
    var res = __assign({ parent: parent || null, children: null, level: parent ? parent.level + 1 : 0, params: null }, routeConfig);
    if (parent) {
        if (!parent.children)
            parent.children = [];
        parent.children.push(res);
    }
    return res;
}
exports.makeRoute = makeRoute;
function makeRouteWithParams(routeConfig, params, parent) {
    var route = makeRoute(routeConfig, parent);
    route.params = params;
    return route;
}
exports.makeRouteWithParams = makeRouteWithParams;
function traverseRoute(routes, visiter) {
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        visiter(route);
        if (route.children) {
            traverseRoute(route.children, visiter);
        }
    }
}
function makeRouter(history) {
    // const history = createBrowserHistory()
    var componentMap = new Map();
    var pathToRouteMap = new Map();
    var initialQuery = {};
    new URLSearchParams(history.location.search).forEach(function (v, k) {
        initialQuery[k] = v;
    }, {});
    var init = function (rootRoutes) {
        traverseRoute(rootRoutes, function (route) {
            pathToRouteMap.set(route.key, route);
            route.component && componentMap.set(route.key, React.lazy(route.component));
            if (route.key === history.location.pathname) {
                route$.next({
                    route: route,
                    params: route$.value.params,
                });
            }
        });
    };
    var route$ = new rxjs_1.BehaviorSubject({
        route: null,
        params: initialQuery,
    });
    function searchParamsFromObject(params) {
        var urlParamsString = "";
        var urlParams = new URLSearchParams();
        if (params) {
            for (var key in params) {
                if (params[key] != undefined && params[key] !== "") {
                    urlParams.set(key, params[key]);
                }
            }
            urlParamsString = "?" + String(urlParams);
        }
        return urlParamsString;
    }
    function createHref(route, params) {
        return route.key + searchParamsFromObject(params);
    }
    function pushHistory(route, params) {
        var newHref = createHref(route, params);
        history.push(newHref);
    }
    function pushParams(params) {
        var urlParamsString = searchParamsFromObject(params);
        if (history.location.search !== urlParamsString)
            history.push(history.location.pathname + urlParamsString);
    }
    history.listen(function (location) {
        var newQuery = {};
        var searchParams = new URLSearchParams(location.search);
        searchParams.forEach(function (v, k) {
            newQuery && (newQuery[k] = v);
        });
        var newRoute = route$.value.route;
        if (!newRoute || location.pathname !== newRoute.key) {
            newRoute = getRouteByKey(history.location.pathname);
        }
        if (newRoute !== route$.value.route || newQuery !== route$.value.params) {
            route$.next({
                route: newRoute,
                params: newQuery
            });
        }
    });
    function WithParams(_a) {
        var Comp = _a.Comp, usedParams = _a.usedParams;
        var _b = React.useState(route$.value.params), params = _b[0], setParams = _b[1];
        React.useEffect(function () {
            var sub = route$.subscribe(function (_a) {
                var params = _a.params;
                return setParams(usedParams.reduce(function (map, k) {
                    map[k] = params[k];
                    return map;
                }, {}));
            });
            return function () { return sub.unsubscribe(); };
        }, [usedParams]);
        return React.createElement(Comp, __assign({}, params));
    }
    function useParams() {
        var _a = React.useState(route$.value.params), params = _a[0], setParams = _a[1];
        React.useEffect(function () {
            var sub = route$.subscribe(function (_a) {
                var params = _a.params;
                return setParams(params);
            });
            return function () { return sub.unsubscribe(); };
        }, []);
        return params;
    }
    function getParams() {
        return route$.value.params;
    }
    function getRouteByKey(key) {
        return pathToRouteMap.get(key) || null;
    }
    return {
        useParams: useParams,
        getParams: getParams,
        getRouteByKey: getRouteByKey,
        pushParams: pushParams,
        pushHistory: pushHistory,
        route$: route$,
        history: history,
        createHref: createHref,
        init: init,
        Router: function () {
            var _a = React.useState({
                CurComp: null,
                curRoute: route$.value.route
            }), _b = _a[0], CurComp = _b.CurComp, curRoute = _b.curRoute, setState = _a[1];
            React.useEffect(function () {
                var sub = route$.subscribe(function (v) {
                    if (v && v.route && v.route.component) {
                        if (!componentMap.has(v.route.key)) {
                            componentMap.set(v.route.key, React.lazy(v.route.component));
                        }
                        setState({
                            curRoute: v.route,
                            CurComp: componentMap.get(v.route.key)
                        });
                    }
                    else {
                        setState({
                            curRoute: null,
                            CurComp: null
                        });
                    }
                });
                return function () { return sub.unsubscribe(); };
            }, []);
            if (CurComp && curRoute) {
                return React.createElement(React.Suspense, { fallback: null }, curRoute.params ? React.createElement(WithParams, { Comp: CurComp, usedParams: curRoute.params }) : React.createElement(CurComp, null));
            }
            else {
                return null;
            }
        }
    };
}
exports.makeRouter = makeRouter;
//# sourceMappingURL=index.js.map