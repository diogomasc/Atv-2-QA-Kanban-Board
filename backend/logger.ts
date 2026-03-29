const isProduction: boolean = process.env.NODE_ENV === 'production';

export function log(context: string, message: string): void {
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.log(`[${context}] ${message}`);
  }
}
