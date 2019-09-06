
# React Typed Router

## Why

Because routes should be typed by its required props. With this router, you don't have to remember each route's props anymore, they will be statically checked by the power of typescript. 

### Params
All dynamic parameters will be in url search string. 

### Path
A specific route can only have a single static path. PARAMETER IN PATHNAME IS WRONG!

## How

```tsx
import {makeRouter,makeRoute,makeRouteWithParams} from "react-typed-router"
import {createBrowserHistory} from "history"

const historyInstance = createBrowserHistory()

const appRouter = makeRouter(historyInstance)

const route1 = makeRoute({
    key:"/route1",
    component:()=>import("../route1")
})

const route2 = makeRouteWithParams({
    key:"/route2",
    component:()=>import("../route2")
},['param1']) // only param1 will be passed from url search to route2 as its props.

const subroute = makeRoute({
    key:"/route1/subroute",
    component:()=>import("../route1/subroute")
},route1)

appRouter.init([
    route1,
    route2,
    // only pass root routes here.
])

function goToSubRoute(){
    appRouter.pushHistory(subroute)
}

function goToRoute2(){
    appRouter.pushHistory(route2,{
        /**
         *   here is why you should use this router:
         *   if u r using typescript, and route2's default export is a stateless component with Props: {param1: "a"|"b" }
         *   then it will prevent any illegal param when you use pushHistory. 
         */
        param1: "some params"
    })
}

function pushParams(){
    appRouter.pushParams({
        someParam:"someParam"
    })
}

function App(){
    return <div>
        <nav>
            <ul>
                <li>
                    <a onClick={goToRoute2} href={appRouter.createHref(route2,{param1:"someParam"})}></a>
                </li>
            </ul>
        </nav>
        <div id="content">
            <appRouter.Router /> 
        </div>
    </div>
}

```