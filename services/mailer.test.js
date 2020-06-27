jest.mock('../lib/log')
const logGen = require('../lib/log')
const logger = {
    info: jest.fn(),
    error: jest.fn()
}
logGen.mockReturnValue(logger)

jest.mock('mailgun-js')
const mailgun = require('mailgun-js');
const messages = {}
mailgun.mockImplementation(() => {
    return {
        messages: () => {
            return messages
        }
    }
})

const email = require('./mailer');

describe('Test mailgun', ()=>{
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should test if mocksend and mailgun is called', async () => {
        messages.send = jest.fn().mockReturnValue(Promise.resolve('hello'))
        await email.sendPasswordResetEmail('paul@github.com', 'token123')
        expect(messages.send).toHaveBeenCalledTimes(1)
        expect(messages.send.mock.calls[0][0]).toMatchSnapshot()
        expect(logger.info).toHaveBeenCalledTimes(1)
        expect(logger.info.mock.calls[0][0]).toEqual('Confirmation Email successfully sent')
    })

    it('should call logger.error when function is called with invalid argument', async () => {
        messages.send = jest.fn().mockReturnValue(Promise.reject('rejected'))
        await email.sendPasswordResetEmail(null, null)
        expect(logger.error).toHaveBeenCalledTimes(1)
        expect(logger.error.mock.calls[0][0]).toEqual('Confirmation Email Error:')
    })

})
