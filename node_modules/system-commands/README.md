# **System commands for JavaScript**

**Run system commands in Node.js**

## **Installation**

```bash
npm i system-commands
```

### **JavaScript**

```javascript
const system = require('system-commands')
```

### **TypeScript**

```typescript
import system = require('system-commands')
```

## **Tutorial**

**Run any command using `system(COMMAND)`. The output is passed into the `.then` block, and the error (if any) is passed into the `.catch` block.**

```typescript
/**
 * Runs a system command
 * 
 * Parameter `command` - The command you want to run, like `ls` or `mkdir new_directory`
 * 
 * Returns a `Promise` containing the output of the command.
 * If the command failed, the error is passed into the `.catch` block.
 */
function system(command: string): Promise<string>
```

**Run the command `ls`:**

```typescript
// async/await

console.log(await system('ls'))

// Handling errors

system('ls').then(output => {
	// Log the output
	console.log(output)
}).catch(error => {
	// An error occurred! Log the error
	console.error(error)
})

// Or for a more concise statement...

system('ls').then(console.log).catch(console.error)

// Output:

/*
 * README.md
 * lib
 * node_modules
 * package-lock.json
 * package.json
 * src
 * tests
 * tsconfig.json
 * tslint.json
 * types
 */
```

**Make a new directory:**

```typescript
system('mkdir new_directory').then(() => {
	// Directory was created
	console.log('Successfully created new_directory')
}).catch(error => {
	// Oh no! An error occurred
	console.error(error)
})

// Output:
// Successfully created directory
```