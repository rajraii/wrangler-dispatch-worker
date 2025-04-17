import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest'; // import `vi` to mock
import worker from '../src';

describe('Dispatch worker', () => {
	it('dispatches to the correct user worker', async () => {
		const request = new Request('http://foo-dev.publive.com');
		const ctx = createExecutionContext();

		// Mock dispatcher
		const mockResponse = new Response('Dispatched Response');
		const mockUserWorker = { fetch: vi.fn().mockResolvedValue(mockResponse) };
		env.dispatcher = {
			get: vi.fn().mockReturnValue(mockUserWorker),
		};

		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(env.dispatcher.get).toHaveBeenCalledWith('foo'); // after removing -dev
		expect(mockUserWorker.fetch).toHaveBeenCalledWith(request);
		expect(await response.text()).toBe('Dispatched Response');
	});

	it('returns 404 if worker not found', async () => {
		const request = new Request('http://missing-dev.publive.com');
		const ctx = createExecutionContext();

		// Mock dispatcher to throw Worker not found error
		env.dispatcher = {
			get: vi.fn(() => {
				const err = new Error('Worker not found');
				throw err;
			}),
		};

		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});

	it('returns 500 for other errors', async () => {
		const request = new Request('http://error-dev.publive.com');
		const ctx = createExecutionContext();

		// Mock dispatcher to throw a generic error
		env.dispatcher = {
			get: vi.fn(() => {
				throw new Error('Something went wrong');
			}),
		};

		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('Something went wrong');
	});
});
