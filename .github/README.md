# InterPatcher 🐒
A library for patching, replacing and decorating javascript methods during runtime.

Also called monkey patching 🐒🐒🐒.

<div align="center">
  <img src="https://github.com/user-attachments/assets/f3ee4d88-ec91-45bb-994b-b95b5e34bede"/>

</div>



# Installation
```shell
npm i @jesusqc/interpatcher
```

# My first patch

```ts
// This prefixes the patched method with another method of our selection
addPrefix(targetObject, 'targetMethod', (prefixData) => {
  console.log("hello from a prefix");
});
```

# Prefixes
Prefixes are patches that run before the original method.
```js
addPrefix(targetObject, 'targetMethod', (prefixData) => {/**/});
```
The callback receives a PrefixData variable which keeps track of:
```ts
context : any, // The context from where the original method was called.
args : any[], // The arguments which were used to call the original method.
originalMethod : Function, // The original method so you can call it without causing overflows.
runOriginal : boolean, // Whether the original method should be skipped.
returnValue : any, // The return value in case you skip to run the original method.
```
So this allows you to completelly replace any method if you wanted to!
```js
addPrefix(Math, 'abs', (prefixData) => {
  prefixData.runOriginal = false;
  prefixData.returnValue = -prefixData.args[0];
});
```
<div align="center">
  <img src="https://github.com/user-attachments/assets/ef1653a6-d2ed-4fee-9f2b-78adef773431"/>
</div>
<br/>
As you can see it is pretty simple!

# Postfixes
Postfixes are like prefixes, but they run after the original method instead.
```js
addPrefix(targetObject, 'targetMethod', (postfixData) => {/**/});
```
The callback receives a PostfixData variable which keeps track of:
```ts
context : any, // The context from where the original method was called.
args : any[], // The arguments which were used to call the original method.
originalMethod : Function, // The original method so you can call it without causing overflows.
returnValue : any, // The return value (which is the original method value by default and can be replaced).
```

# Unpatching
For unpatching just save the returned id for your prefix or postfix:
```js
const prefixId = addPrefix(...);
unpatchPrefix(targetObject, targetMethod, prefixId);
const postfixId = addPostfix(...);
unpatchPostfix(targetObject, targetMethod, postfixId);
```

You can also unpatch all prefixes, postfixes and overrides from a patched method:
```js
unpatchAll(targetObject, 'targetMethod');
```

# Multi Prefixes, Postfixes and Overrides
Yes, you can have multiple prefixes, postfixes and overrides for a single method, they will run in order of registration, meaning that the later you register a method, the later it will run.
