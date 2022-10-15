/**
 * Linear intermediate representation of a label.
 */
export class Label {
    private _local: boolean;
    private _name: string;
    private _address: number;

    /**
     * Creates a new linear intermediate label representation.
     * @param {object} opts
     * @param {string} opts.name The name for the label.
     * @param {boolean} opts.local `true` if the label is local, `false`
     *   otherwise.
     */
    constructor(options: {
        name: string;
        local: boolean;
    }) {
        const { name, local } = options;
        this.address = -1
        this._local = local
        this._name = name
    }

    /**
     * @return {number} The instruction address for the label.
     */
    get address(): number {
        return this._address
    }

    /**
     * Sets the instruction address for the label.
     * @param {number} addr The address to set.
     */
    set address(addr: number) {
        this._address = addr
    }

    /**
     * @return {boolean} `true` if this is a local label, `false` otherwise.
     */
    get local(): boolean {
        return this._local
    }

    /**
     * @return {string} The name of the label.
     */
    get name(): string {
        return this._name
    }
}  