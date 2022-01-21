export function devLogger(level: any): (type: any, { error, warning, ...message }: {
    [x: string]: any;
    error: any;
    warning: any;
}) => void;
export function prodLogger(level: any): (msg: any, params: any) => void;
//# sourceMappingURL=logger.d.ts.map