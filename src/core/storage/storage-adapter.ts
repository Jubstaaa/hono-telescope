import type { EntryMap, EntryType } from '../entries.js'

export interface ListOptions {
    limit?: number
    offset?: number
}

export interface StorageAdapter {
    clear(): Promise<void>
    count(type: EntryType): Promise<number>
    find<T extends EntryType>(type: T, id: string): Promise<EntryMap[T] | null>

    findByParent<T extends EntryType>(
        type: T,
        parentId: string
    ): Promise<EntryMap[T][]>

    list<T extends EntryType>(
        type: T,
        opts?: ListOptions
    ): Promise<EntryMap[T][]>
    record<T extends EntryType>(type: T, entry: EntryMap[T]): Promise<void>
}
