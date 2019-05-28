import { firestore, Unsubscribe } from 'firebase'

const dbInstance = firestore()

type EnhancedDocSnapshot<T> = {
  [P in keyof T]: T[P];
} & {
  uid: string,
  ref: firestore.DocumentReference 
}

function toEDoc<T>(doc: firestore.DocumentSnapshot ): EnhancedDocSnapshot<T> {
  const data = doc.data() as T
  return { ...data, uid: doc.id, ref: doc.ref }
}


export class FirebaseCRUDCreator<T> {
  constructor(
    private collectionPath: string,
    private collection = dbInstance.collection(collectionPath)
  ) {}

  add = (data: T) => {
    return this.collection.add(data)
  }

  set = (id: string, data: T) => {
    return this.collection.doc(id).set(data)
  }

  update = (id: string, data: Partial<T>) => {
    return this.collection.doc(id).update(data)
  }

  delete = (id: string) => {
    return this.collection.doc(id).delete()
  }

  getOne = async(id: string): Promise<EnhancedDocSnapshot<T> | null> => {
    const doc = await this.collection.doc(id).get()
    return toEDoc<T>(doc)
  }

  getWhere = async(
    field: string, 
    filter: firestore.WhereFilterOp, 
    value: string
  ): Promise<EnhancedDocSnapshot<T>[]> => {
    const docs = await this.collection.where(field, filter, value).get()
    return docs.docs.map(d => toEDoc<T>(d))
  }

  getMany = async(): Promise<EnhancedDocSnapshot<T>[]> => {
    const docs = await this.collection.get()
    return docs.docs.map(d => toEDoc<T>(d))
  } 

  subscribeToOne = (
    id: string, 
    onValueChange: (doc: EnhancedDocSnapshot<T> | null) => any
  ): Unsubscribe => {
    return this.collection.doc(id).onSnapshot(doc => {
      if (doc) {
        onValueChange(toEDoc<T>(doc)) 
      }

      onValueChange(null)
    })
  }

  subscribeToMany = (
    onValueChange: (docs: EnhancedDocSnapshot<T>[]) => any
  ): Unsubscribe => {
    return this.collection.onSnapshot(docs => {
      onValueChange(docs.docs.map(d => toEDoc<T>(d)))
    })
  }

  subscribeWhere = (
    field: string, 
    filter: firestore.WhereFilterOp, 
    value: string,
    onValueChange: (docs: EnhancedDocSnapshot<T>[]) => any
  ): Unsubscribe => {
    return this.collection.where(field, filter, value).onSnapshot(docs => {
      onValueChange(docs.docs.map(d => toEDoc<T>(d)))
    })
  }
}