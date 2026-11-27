import { randomUUID } from 'node:crypto'

import type { ContextStrategy } from './context/context-strategy.js'
import type {
    CreateInputMap,
    EntryMap,
    EntryType,
    QueryCreateInput,
} from './entries.js'
import type { ListOptions, StorageAdapter } from './storage/storage-adapter.js'

export class Recorder {
    constructor(
        private readonly storage: StorageAdapter,
        private readonly context: ContextStrategy
    ) {}

    clear(): Promise<void> {
        return this.storage.clear()
    }

    count(type: EntryType): Promise<number> {
        return this.storage.count(type)
    }

    find<T extends EntryType>(
        type: T,
        id: string
    ): Promise<EntryMap[T] | null> {
        return this.storage.find(type, id)
    }

    findByParent<T extends EntryType>(
        type: T,
        parentId: string
    ): Promise<EntryMap[T][]> {
        return this.storage.findByParent(type, parentId)
    }

    list<T extends EntryType>(
        type: T,
        opts?: ListOptions
    ): Promise<EntryMap[T][]> {
        return this.storage.list(type, opts)
    }

    async record<T extends EntryType>(
        type: T,
        input: CreateInputMap[T],
        id?: string
    ): Promise<string> {
        const explicitParent = (input as { parent_id?: string }).parent_id
        const inheritedParent =
            type === 'incoming_request'
                ? undefined
                : this.context.current()?.requestId

        const entry = {
            ...input,
            created_at: new Date().toISOString(),
            id: id ?? randomUUID(),
            parent_id: explicitParent ?? inheritedParent,
            timestamp: Date.now(),
        } as EntryMap[T]

        await this.storage.record(type, entry)
        return entry.id
    }

    recordQuery(input: QueryCreateInput): Promise<string> {
        return this.record('query', input)
    }
}
