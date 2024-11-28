import { Name } from '@wharfkit/antelope';
import { customAlphabet } from 'nanoid'

export const randomCode = customAlphabet(
    '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
    22
)

export const urlParams = (params: Record<string, string>) =>
    new URLSearchParams(params).toString()

export function validName(value: string) {
	try {
		const name = Name.from(value);
		if (value && String(name) === value) {
			return true;
		}
		return false;
	} catch (e) {
		return false;
	}
}
