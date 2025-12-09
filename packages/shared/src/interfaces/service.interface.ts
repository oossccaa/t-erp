export interface CrudService<T, CreateDto, UpdateDto> {
  create(createDto: CreateDto): Promise<T>
  findAll(): Promise<T[]>
  findById(id: number): Promise<T | null>
  update(id: number, updateDto: UpdateDto): Promise<T>
  remove(id: number): Promise<void>
}

export interface Repository<T> {
  create(entity: Partial<T>): Promise<T>
  findAll(): Promise<T[]>
  findById(id: number): Promise<T | null>
  update(id: number, entity: Partial<T>): Promise<T>
  delete(id: number): Promise<void>
}