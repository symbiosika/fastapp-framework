declare module "widdershins" {
  interface WiddershinsOptions {
    language_tabs?: Array<Record<string, string>>;
    summary?: boolean;
    tocSummary?: boolean;
    [key: string]: any;
  }

  function convert(spec: any, options?: WiddershinsOptions): Promise<string>;

  export = {
    convert,
  };
}
