
require("jest")

const {createBrowserHistory} = require('history')
const {makeRouter,makeRoute,makeRouteWithParams} = require("./dist")
const ReactTestUtils = require('react-dom/test-utils'); // ES5 with npm
const ReactDom = require('react-dom')
const React = require("react")

let container
let router
let history
let root

let route1 
let route2
let route3
let route4
let route5

beforeEach(()=>{
    history = createBrowserHistory()
    router = makeRouter(history)
    route1 = makeRoute({
        key:"/",
        component:async ()=>({
            default: ()=>React.createElement('h1',null,"initial")
        })
    })
    route2 = makeRoute({
        key:"/route2",
        component:async ()=>({
            default: ()=>React.createElement('h2',null,"route2")
        })
    })
    route3 = makeRouteWithParams({
        key:"/route3",
        component:async ()=>({
            default: ({params1, notListedParams})=>{
                return React.createElement('h3',null,
                    React.createElement("span",null,params1),
                    React.createElement("span",null,notListedParams),
                )
            }
        })
    },['params1']) //cannot test typescript typing here.
    route4 = makeRoute({
        key:"/route4",
    })
    route5 = makeRouteWithParams({
        key:"/route4/route5",
        component:async ()=>({
            default: ({params2})=>React.createElement('h5',null,params2)
        })
    },['params2'],route4)
    router.init([
        route1,
        route2,
        route3,
        route4,
    ])
    container = document.createElement('div');
    ReactTestUtils.act(()=>{
        root = React.createElement(router.Router)
        ReactDom.render(root,container)
    })
    document.body.appendChild(container);
})

afterEach(()=>{
    document.body.removeChild(container);
    container = null;
    root = null;
})

function wait(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

describe("functional test", ()=>{
    test("it should start at / on initial enter",async (done)=>{
        expect(document.location.pathname === "/").toBe(true)
        await wait(1) //must wait mount
        expect(document.querySelector("h1") !== null).toBe(true) //show route1
        done()
    })
    test("it should go to route2 when push, and update inner route$ observable",async (done)=>{
        await wait(1) //must wait mount
        ReactTestUtils.act(()=>{
            router.pushHistory(route2)
        })
        await wait(1)
        expect(document.location.pathname===route2.key).toBe(true)
        expect(router.route$.value.route).toBe(route2)
        const h2 = document.querySelector("h2")
        expect(h2 !== null).toBe(true) //show route2
        done()
    })
    test("it should change url search when pushParams, and update inner route$ observable",async done=>{
        const params1="someparams"
        ReactTestUtils.act(()=>{
            router.pushParams({
                params1
            })
        })
        await wait(1)
        expect(document.location.search).toBe("?params1="+params1)
        expect(router.getParams().params1).toBe(params1)
        expect(router.route$.value.params.params1).toBe(params1)
        done()
    })
    test("it should pass params to route, but only listed params",async done=>{
        await wait(1) //must wait mount
        const params1 = "this param will be passed to component"
        const notListedParams = "this will not be passed to component"
        ReactTestUtils.act(()=>{
            router.pushHistory(route3,{
                params1,
                notListedParams
            })
        })
        await wait(100)
        const searchParams = new URLSearchParams(document.location.search)
        expect(searchParams.get("params1")).toBe(params1)
        expect(searchParams.get("notListedParams")).toBe(notListedParams)
        const h3 = document.querySelector("h3")
        expect(h3.innerHTML).toBe(`<span>${params1}</span><span></span>`)
        done()
    })
    test("it should go to child route when push a child route", async done=>{
        await wait(1) //must wait mount
        const params2 = "this param will be passed to component"
        ReactTestUtils.act(()=>{
            router.pushHistory(route5,{
                params2,
            })
        })
        await wait(100)
        const h5 = document.querySelector("h5")
        expect(h5.innerHTML).toBe(params2)
        const searchParams = new URLSearchParams(document.location.search)
        expect(searchParams.get("params2")).toBe(params2)
        expect(router.route$.value.route).toBe(route5)
        done()
    })
})