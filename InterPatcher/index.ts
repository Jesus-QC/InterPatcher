/*
 * InterPatcher
 * Patching made easy. Made with love by Jesus-QC.
 * The best monkey patching library for JavaScript.
 */

interface PostfixData{
    context : any,
    args : any[],
    originalMethod : Function,
    returnValue : any,
}

interface PrefixData extends PostfixData{
    runOriginal : boolean
}

interface PatchedMethod{
    prefixes : Map<number, Function>,
    postfixes : Map<number, Function>,
    original : Function,
}

/*
 * Adds a method that will be called before the target method.
 * @param targetObject The object containing the target method
 * @param targetMethod The name of the target method
 * @param callback The method to be called before the target method. If runOriginal is set to false, the original method will not be called and returnValue will be returned instead.
 */
export function addPrefix(targetObject : any, targetMethod : string, callback : (data : PrefixData) => void) : number | undefined{
    if (!checkFunction(targetObject, targetMethod))
        return;

    patchFunction(targetObject, targetMethod);

    let id : number = generatePatchId();

    targetObject.___ip[targetMethod].prefixes.set(id, callback);
    return id;
}

/*
 * Adds a method that will be called after the target method.
 * @param targetObject The object containing the target method
 * @param targetMethod The name of the target method
 * @param callback The method to be called after the target method. The return value of the target method is passed as an argument.
 */
export function addPostfix(targetObject : any, targetMethod : string, callback : (data : PostfixData) => void) : number | undefined{
    if (!checkFunction(targetObject, targetMethod))
        return;

    patchFunction(targetObject, targetMethod);

    let id : number = generatePatchId();

    targetObject.___ip[targetMethod].postfixes.set(id, callback);
    return id;
}

export function unpatchPrefix(targetObject : any, targetMethod : string, id : number){
    if (!checkFunction(targetObject, targetMethod))
        return;

    targetObject.___ip[targetMethod].prefixes.delete(id);
}


export function unpatchPostfix(targetObject : any, targetMethod : string, id : number){
    if (!checkFunction(targetObject, targetMethod))
        return;

    targetObject.___ip[targetMethod].postfixes.delete(id);
}

/*
 * Replaces a function with a new one which calls prefixes, postfixes and the original function.
 * @param targetObject The object containing the target method
 * @param targetMethod The name of the target method
 */
function patchFunction(targetObject : any, targetMethod : string){
    if (!checkFunction(targetObject, targetMethod)) return;

    patchObject(targetObject);

    let targetFunction : Function = targetObject[targetMethod];

    if (targetObject.___ip[targetMethod] != undefined){
        // Function already patched.
        return;
    }

    let patch = targetObject.___ip[targetMethod] = {
        prefixes: new Map<number, Function>(),
        postfixes: new Map<number, Function>(),
        original: targetFunction,
    } as PatchedMethod;

    let proxy = new Proxy<Function>(targetFunction, {
        apply(target: Function, thisArg: any, argArray: any[]): any {
            return runPatched(patch, thisArg, argArray, false);
        },

        construct(target: Function, argArray: any[], newTarget: Function) : object {
            return runPatched(patch, newTarget, argArray, true) as object;
        }
    });

    if (!Reflect.defineProperty(targetObject, targetMethod, {
        value: proxy,
        writable: true,
        configurable: true,
        enumerable: false
    })){
       targetObject[targetMethod] = proxy;
    }
}

function patchObject(targetObject : any){
    if (targetObject.___ip != undefined){
        // Object already patched.
        return;
    }

    targetObject.___ip = {};
}

function checkFunction(targetObject : any, targetMethod : string){
    if (typeof targetObject[targetMethod] != "function"){
        console.error(`Target ${targetMethod} is not a function`);
        return false;
    }

    return true;
}

function runPatched(patchedMethod : PatchedMethod, context : any, args : any[], isConstructor : boolean = false) : null | object {
    let data : PrefixData = runPrefixes(patchedMethod, context, args);

    if (!data.runOriginal){
        return data.returnValue;
    }

    if (isConstructor){
        data.returnValue = Reflect.construct(patchedMethod.original, data.args);
    } else {
        data.returnValue = patchedMethod.original.apply(context, data.args);
    }

    return runPostfixes(patchedMethod, context, args, data.returnValue);
}

function runPrefixes(patchedMethod : PatchedMethod, context : any, args : any[]) : PrefixData {
    let data : PrefixData = {
        context: context,
        args: args,
        originalMethod: patchedMethod.original,
        returnValue: undefined,
        runOriginal: true
    };

    patchedMethod.prefixes.forEach(prefix => prefix.apply(context, [data]));
    return data;
}

function runPostfixes(patchedMethod : PatchedMethod, context : any, args : any[], returnValue : any) : any {
    let data : PostfixData = {
        context: context,
        args: args,
        originalMethod: patchedMethod.original,
        returnValue: returnValue
    };

    patchedMethod.postfixes.forEach((postfix, _) => postfix.apply(context, [data]));
    return data.returnValue;
}

let patchGenerator = 0;

function generatePatchId() : number {
    return patchGenerator++;
}