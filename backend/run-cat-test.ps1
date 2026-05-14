$env:NODE_ENV = 'test'
Set-Location 'C:\Users\student\_vibe\todolist-app\backend'
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/integration/category/category.test.js --no-coverage --runInBand *> 'C:\Users\student\_vibe\todolist-app\backend\test-output.txt'
