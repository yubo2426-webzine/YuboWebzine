# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListArticles*](#listarticles)
  - [*MySubscriptionTypes*](#mysubscriptiontypes)
- [**Mutations**](#mutations)
  - [*CreateDemoUser*](#createdemouser)
  - [*CreateComment*](#createcomment)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListArticles
You can execute the `ListArticles` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listArticles(): QueryPromise<ListArticlesData, undefined>;

interface ListArticlesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListArticlesData, undefined>;
}
export const listArticlesRef: ListArticlesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listArticles(dc: DataConnect): QueryPromise<ListArticlesData, undefined>;

interface ListArticlesRef {
  ...
  (dc: DataConnect): QueryRef<ListArticlesData, undefined>;
}
export const listArticlesRef: ListArticlesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listArticlesRef:
```typescript
const name = listArticlesRef.operationName;
console.log(name);
```

### Variables
The `ListArticles` query has no variables.
### Return Type
Recall that executing the `ListArticles` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListArticlesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListArticlesData {
  articles: ({
    id: UUIDString;
    title: string;
    content: string;
    publishedAt: TimestampString;
    author?: {
      id: UUIDString;
      displayName: string;
    } & User_Key;
  } & Article_Key)[];
}
```
### Using `ListArticles`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listArticles } from '@dataconnect/generated';


// Call the `listArticles()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listArticles();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listArticles(dataConnect);

console.log(data.articles);

// Or, you can use the `Promise` API.
listArticles().then((response) => {
  const data = response.data;
  console.log(data.articles);
});
```

### Using `ListArticles`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listArticlesRef } from '@dataconnect/generated';


// Call the `listArticlesRef()` function to get a reference to the query.
const ref = listArticlesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listArticlesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.articles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.articles);
});
```

## MySubscriptionTypes
You can execute the `MySubscriptionTypes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
mySubscriptionTypes(): QueryPromise<MySubscriptionTypesData, undefined>;

interface MySubscriptionTypesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MySubscriptionTypesData, undefined>;
}
export const mySubscriptionTypesRef: MySubscriptionTypesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
mySubscriptionTypes(dc: DataConnect): QueryPromise<MySubscriptionTypesData, undefined>;

interface MySubscriptionTypesRef {
  ...
  (dc: DataConnect): QueryRef<MySubscriptionTypesData, undefined>;
}
export const mySubscriptionTypesRef: MySubscriptionTypesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the mySubscriptionTypesRef:
```typescript
const name = mySubscriptionTypesRef.operationName;
console.log(name);
```

### Variables
The `MySubscriptionTypes` query has no variables.
### Return Type
Recall that executing the `MySubscriptionTypes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MySubscriptionTypesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MySubscriptionTypesData {
  subscriptionTypes: ({
    id: UUIDString;
    type: string;
    targetId: UUIDString;
  } & SubscriptionType_Key)[];
}
```
### Using `MySubscriptionTypes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, mySubscriptionTypes } from '@dataconnect/generated';


// Call the `mySubscriptionTypes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await mySubscriptionTypes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await mySubscriptionTypes(dataConnect);

console.log(data.subscriptionTypes);

// Or, you can use the `Promise` API.
mySubscriptionTypes().then((response) => {
  const data = response.data;
  console.log(data.subscriptionTypes);
});
```

### Using `MySubscriptionTypes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, mySubscriptionTypesRef } from '@dataconnect/generated';


// Call the `mySubscriptionTypesRef()` function to get a reference to the query.
const ref = mySubscriptionTypesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = mySubscriptionTypesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.subscriptionTypes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.subscriptionTypes);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateDemoUser
You can execute the `CreateDemoUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createDemoUser(): MutationPromise<CreateDemoUserData, undefined>;

interface CreateDemoUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateDemoUserData, undefined>;
}
export const createDemoUserRef: CreateDemoUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createDemoUser(dc: DataConnect): MutationPromise<CreateDemoUserData, undefined>;

interface CreateDemoUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateDemoUserData, undefined>;
}
export const createDemoUserRef: CreateDemoUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createDemoUserRef:
```typescript
const name = createDemoUserRef.operationName;
console.log(name);
```

### Variables
The `CreateDemoUser` mutation has no variables.
### Return Type
Recall that executing the `CreateDemoUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateDemoUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateDemoUserData {
  user_insert: User_Key;
}
```
### Using `CreateDemoUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createDemoUser } from '@dataconnect/generated';


// Call the `createDemoUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createDemoUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createDemoUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createDemoUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateDemoUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createDemoUserRef } from '@dataconnect/generated';


// Call the `createDemoUserRef()` function to get a reference to the mutation.
const ref = createDemoUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createDemoUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## CreateComment
You can execute the `CreateComment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createComment(vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface CreateCommentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
}
export const createCommentRef: CreateCommentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createComment(dc: DataConnect, vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface CreateCommentRef {
  ...
  (dc: DataConnect, vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
}
export const createCommentRef: CreateCommentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCommentRef:
```typescript
const name = createCommentRef.operationName;
console.log(name);
```

### Variables
The `CreateComment` mutation requires an argument of type `CreateCommentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCommentVariables {
  articleId: UUIDString;
  content: string;
}
```
### Return Type
Recall that executing the `CreateComment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCommentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCommentData {
  comment_insert: Comment_Key;
}
```
### Using `CreateComment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createComment, CreateCommentVariables } from '@dataconnect/generated';

// The `CreateComment` mutation requires an argument of type `CreateCommentVariables`:
const createCommentVars: CreateCommentVariables = {
  articleId: ..., 
  content: ..., 
};

// Call the `createComment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createComment(createCommentVars);
// Variables can be defined inline as well.
const { data } = await createComment({ articleId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createComment(dataConnect, createCommentVars);

console.log(data.comment_insert);

// Or, you can use the `Promise` API.
createComment(createCommentVars).then((response) => {
  const data = response.data;
  console.log(data.comment_insert);
});
```

### Using `CreateComment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCommentRef, CreateCommentVariables } from '@dataconnect/generated';

// The `CreateComment` mutation requires an argument of type `CreateCommentVariables`:
const createCommentVars: CreateCommentVariables = {
  articleId: ..., 
  content: ..., 
};

// Call the `createCommentRef()` function to get a reference to the mutation.
const ref = createCommentRef(createCommentVars);
// Variables can be defined inline as well.
const ref = createCommentRef({ articleId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCommentRef(dataConnect, createCommentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.comment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.comment_insert);
});
```

