const system = require('../lib/index.js')

it('handles errors', async done => {
	try {
		await system('echo \'error\' >& 2 && exit 1')
		done.fail('.catch was not called')
	} catch (error) {
		expect(error).toBe('error')
		done()
	}
})

it('handles no output', async done => {
	try {
		const output = await system('rm -rf \'directory_that_does_not_exist\'')
		expect(output).toBe('')
		done()
	} catch (error) {
		done.fail(`.catch statement was called: ${error}`)
	}
})